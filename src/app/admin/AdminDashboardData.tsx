import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminDashboardClient, {
  DashboardKpis,
  DashboardOrderRow,
  DashboardCodCollection,
} from './AdminDashboardClient';

export default async function AdminDashboardData() {
  const adminClient = createAdminClient();

  // Helper to extract customer name & email
  const normalizeOrder = (order: any): DashboardOrderRow => {
    const addr =
      typeof order.shipping_address_snapshot === 'object' && order.shipping_address_snapshot !== null
        ? order.shipping_address_snapshot
        : {};

    const rawCustomer = Array.isArray(order.customer) ? order.customer[0] : order.customer;
    const customerName = addr.recipient_name || rawCustomer?.full_name || 'Customer';
    const customerEmail = rawCustomer?.email || 'N/A';

    const paymentsList = Array.isArray(order.payments) ? order.payments : [];
    paymentsList.sort((a: any, b: any) => (b.attempt_number ?? 0) - (a.attempt_number ?? 0));
    const latestPending = paymentsList.find((p: any) => p.verification_status === 'pending');

    return {
      id: order.id,
      orderNumber: order.order_number ? `#ORD-${order.order_number}` : `#ORD-${order.id.slice(0, 6)}`,
      orderType: order.order_type || 'online',
      customerName,
      customerEmail,
      totalAmount: Number(order.total_amount) || 0,
      deliveryFee: order.delivery_fee != null ? Number(order.delivery_fee) : 100,
      paymentStatus: order.payment_status || 'pending',
      status: order.status || 'Pending Verification',
      date: order.created_at ? order.created_at.split('T')[0] : 'Today',
      pendingUtr: latestPending?.utr_reference || null,
    };
  };

  // PERFORMANCE OPTIMIZATION:
  // Parallelize bounded queries:
  // 1. RPC or lightweight aggregates for KPIs (zero megabyte table scans)
  // 2. Exactly 7 recent orders with .limit(7)
  // 3. Exactly 5 pending verifications with .limit(5)
  // 4. Exactly 5 recent collections with .limit(5)
  const [
    kpiRpcRes,
    recentOrdersRes,
    pendingVerificationsRes,
    recentCollectionsRes,
  ] = await Promise.all([
    adminClient.rpc('get_admin_dashboard_kpis'),
    adminClient
      .from('orders')
      .select(`
        id,
        order_number,
        order_type,
        status,
        payment_status,
        subtotal,
        delivery_fee,
        total_amount,
        advance_amount_paid,
        balance_amount_due,
        shipping_address_snapshot,
        created_at,
        customer:profiles!orders_user_id_fkey ( full_name, email ),
        payments (
          id,
          attempt_number,
          verification_status,
          utr_reference,
          created_at
        )
      `)
      .neq('status', 'Awaiting Payment')
      .order('created_at', { ascending: false })
      .limit(7),
    adminClient
      .from('orders')
      .select(`
        id,
        order_number,
        order_type,
        status,
        payment_status,
        subtotal,
        delivery_fee,
        total_amount,
        advance_amount_paid,
        balance_amount_due,
        shipping_address_snapshot,
        created_at,
        customer:profiles!orders_user_id_fkey ( full_name, email ),
        payments (
          id,
          attempt_number,
          verification_status,
          utr_reference,
          created_at
        )
      `)
      .eq('status', 'Pending Verification')
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('order_collections')
      .select(`
        id,
        order_id,
        amount_collected,
        collection_type,
        payment_method,
        collected_at,
        created_at,
        orders ( id, order_number )
      `)
      .order('collected_at', { ascending: false })
      .limit(5),
  ]);

  let kpis: DashboardKpis;

  // If database aggregate RPC is available, use database-computed aggregates (< 3ms)
  if (!kpiRpcRes.error && kpiRpcRes.data) {
    const d = kpiRpcRes.data as any;
    kpis = {
      totalOrders: Number(d.total_orders) || 0,
      pendingVerificationCount: Number(d.pending_verification_count) || 0,
      onlineOrdersCount: Number(d.online_orders_count) || 0,
      codOrdersCount: Number(d.cod_orders_count) || 0,
      awaitingDispatchCount: Number(d.awaiting_dispatch_count) || 0,
      deliveredCount: Number(d.delivered_count) || 0,
      outstandingCodBalance: Number(d.outstanding_cod_balance) || 0,
      collectedCodRevenue: Number(d.collected_cod_revenue) || 0,
    };
  } else {
    // Ultra-lightweight fallback: fetch only 4 minimal columns without any joins
    const [fallbackOrdersRes, fallbackCollectionsRes] = await Promise.all([
      adminClient
        .from('orders')
        .select('status, order_type, payment_status, balance_amount_due')
        .neq('status', 'Awaiting Payment'),
      adminClient
        .from('order_collections')
        .select('amount_collected'),
    ]);

    const fallbackOrders = fallbackOrdersRes.data || [];
    const fallbackCollections = fallbackCollectionsRes.data || [];

    const totalOrders = fallbackOrders.length;
    const onlineOrdersCount = fallbackOrders.filter((o: any) => o.order_type === 'online').length;
    const codOrdersCount = fallbackOrders.filter((o: any) => o.order_type === 'cod').length;
    const awaitingDispatchCount = fallbackOrders.filter((o: any) =>
      ['Confirmed', 'Processing'].includes(o.status)
    ).length;
    const deliveredCount = fallbackOrders.filter((o: any) => o.status === 'Delivered').length;
    const pendingVerificationCount = fallbackOrders.filter((o: any) => o.status === 'Pending Verification').length;

    const outstandingCodBalance = fallbackOrders
      .filter(
        (o: any) =>
          o.order_type === 'cod' &&
          o.payment_status !== 'fully_paid' &&
          o.status !== 'Cancelled'
      )
      .reduce((sum: number, o: any) => sum + (Number(o.balance_amount_due) || 0), 0);

    const collectedCodRevenue = fallbackCollections.reduce(
      (sum: number, c: any) => sum + (Number(c.amount_collected) || 0),
      0
    );

    kpis = {
      totalOrders,
      pendingVerificationCount,
      onlineOrdersCount,
      codOrdersCount,
      awaitingDispatchCount,
      deliveredCount,
      outstandingCodBalance,
      collectedCodRevenue,
    };
  }

  const recentOrders: DashboardOrderRow[] = (recentOrdersRes.data || []).map(normalizeOrder);
  const pendingVerifications: DashboardOrderRow[] = (pendingVerificationsRes.data || []).map(normalizeOrder);

  const recentCollections: DashboardCodCollection[] = (recentCollectionsRes.data || []).map((c: any) => {
    const orderObj = Array.isArray(c.orders) ? c.orders[0] : c.orders;
    return {
      id: c.id,
      orderId: c.order_id,
      orderNumber: orderObj?.order_number ? `#COD-${orderObj.order_number}` : `#COD-${c.order_id.slice(0, 6)}`,
      amountCollected: Number(c.amount_collected ?? c.amount) || 0,
      paymentMethod: c.payment_method || 'cash',
      collectedAt: c.collected_at || c.created_at,
    };
  });

  return (
    <AdminDashboardClient
      kpis={kpis}
      recentOrders={recentOrders}
      pendingVerifications={pendingVerifications}
      recentCollections={recentCollections}
    />
  );
}

