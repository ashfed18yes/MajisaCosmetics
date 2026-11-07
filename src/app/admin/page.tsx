import React from 'react';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminDashboardClient, {
  DashboardKpis,
  DashboardOrderRow,
  DashboardCodCollection,
} from './AdminDashboardClient';

export const metadata = {
  title: 'Operations Dashboard | MajisaAdmin',
  description: 'Enterprise operations, fulfillment KPIs, and real-time payment audit.',
};

export default async function AdminDashboardPage() {
  await requireAdmin();
  const adminClient = createAdminClient();

  // 1. Fetch real orders from Supabase with authoritative schema columns
  const { data: rawOrders, error: ordersError } = await adminClient
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
      cod_balance_collected,
      shipping_address_snapshot,
      created_at,
      customer:profiles!orders_user_id_fkey ( full_name, email, phone ),
      payments (
        id,
        attempt_number,
        verification_status,
        utr_reference,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('Error fetching dashboard orders:', {
      message: ordersError.message,
      code: ordersError.code,
      details: ordersError.details,
    });
  }

  // 2. Fetch confirmed doorstep collections from public.order_collections
  const { data: rawCollections, error: collectionsError } = await adminClient
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
    .order('collected_at', { ascending: false });

  if (collectionsError) {
    console.error('Error fetching dashboard collections:', {
      message: collectionsError.message,
      code: collectionsError.code,
      details: collectionsError.details,
    });
  }

  const orders = rawOrders || [];
  const collections = rawCollections || [];

  // =========================================================================
  // KPI CALCULATIONS (Strictly real Supabase records, zero mock data)
  // =========================================================================

  const totalOrders = orders.length;

  const onlineOrdersCount = orders.filter((o: any) => o.order_type === 'online').length;
  const codOrdersCount = orders.filter((o: any) => o.order_type === 'cod').length;

  const awaitingDispatchCount = orders.filter((o: any) =>
    ['Confirmed', 'Processing'].includes(o.status)
  ).length;

  const deliveredCount = orders.filter((o: any) => o.status === 'Delivered').length;

  // Pending payment verification count:
  // Strictly orders awaiting admin action: status is 'Pending Verification' or has an active payment attempt in 'pending' status.
  // Excludes 'Payment Action Required' (which awaits customer re-submission, not admin review) and 'Cancelled' orders.
  // Filters over distinct order records to guarantee no duplicate counts from multiple payment attempts.
  const pendingOrdersList = orders.filter((o: any) => {
    if (o.status === 'Cancelled') return false;
    if (o.status === 'Pending Verification') return true;
    const payments = Array.isArray(o.payments) ? o.payments : [];
    return payments.some((p: any) => p.verification_status === 'pending');
  });
  const pendingVerificationCount = pendingOrdersList.length;

  // Outstanding COD balance:
  // Actual balance_amount_due on active (non-cancelled, non-fully-paid) COD orders.
  // Strictly excludes cancelled orders to avoid inflating the outstanding balance.
  const outstandingCodBalance = orders
    .filter(
      (o: any) =>
        o.order_type === 'cod' &&
        o.payment_status !== 'fully_paid' &&
        o.status !== 'Cancelled'
    )
    .reduce((sum: number, o: any) => sum + (Number(o.balance_amount_due) || 0), 0);

  // Collected COD revenue:
  // Authoritative sum of amount_collected from public.order_collections table.
  // Doorstep collections only; strictly excludes COD advance payments (Rs 100) which reside in public.payments.
  const collectedCodRevenue = collections.reduce(
    (sum: number, c: any) => sum + (Number(c.amount_collected ?? c.amount) || 0),
    0
  );

  const kpis: DashboardKpis = {
    totalOrders,
    pendingVerificationCount,
    onlineOrdersCount,
    codOrdersCount,
    awaitingDispatchCount,
    deliveredCount,
    outstandingCodBalance,
    collectedCodRevenue,
  };

  // =========================================================================
  // NORMALIZATION FOR DISPLAY TABLES
  // =========================================================================

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
      paymentStatus: order.payment_status || 'pending',
      status: order.status || 'Pending Verification',
      date: order.created_at ? order.created_at.split('T')[0] : 'Today',
      pendingUtr: latestPending?.utr_reference || null,
    };
  };

  const recentOrders: DashboardOrderRow[] = orders.slice(0, 7).map(normalizeOrder);
  const pendingVerifications: DashboardOrderRow[] = pendingOrdersList.slice(0, 5).map(normalizeOrder);

  const recentCollections: DashboardCodCollection[] = collections.slice(0, 5).map((c: any) => {
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
