import React from 'react';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminOnlineOrdersClient, { AdminOrderRow, AdminPaginationData } from './AdminOnlineOrdersClient';

export const metadata = {
  title: 'Online Orders | MajisaAdmin',
  description: 'Track and manage customer online orders and manual payment verifications.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchParams {
  page?: string;
  search?: string;
  status?: string;
}

interface PageProps {
  searchParams?: Promise<SearchParams>;
}

export default async function AdminOnlineOrdersPage({ searchParams }: PageProps) {
  const [, resolvedParams] = await Promise.all([
    requireAdmin(),
    searchParams ? searchParams : Promise.resolve<SearchParams>({}),
  ]);
  const adminClient = createAdminClient();

  // Pagination parameters (25 items per page)
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const pageSize = 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = resolvedParams.search?.trim() || '';
  const statusFilter = resolvedParams.status?.trim() || 'All';

  // Build query with exact count & bounded range
  let query = adminClient
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
      customer_notes,
      courier_partner,
      tracking_number,
      created_at,
      customer:profiles!orders_user_id_fkey ( id, full_name, email, phone ),
      order_items ( quantity ),
      payments (
        id,
        attempt_number,
        payment_method,
        verification_status,
        amount_expected,
        amount_submitted,
        utr_reference,
        proof_public_id,
        created_at
      )
    `, { count: 'exact' })
    .eq('order_type', 'online')
    .neq('status', 'Awaiting Payment');

  if (statusFilter && statusFilter !== 'All') {
    if (statusFilter === 'Shipped') {
      query = query.in('status', ['Shipped', 'Dispatched']);
    } else if (statusFilter === 'Processing') {
      query = query.in('status', ['Processing', 'Confirmed']);
    } else if (statusFilter === 'Pending') {
      query = query.in('status', ['Pending Verification', 'Payment Action Required']);
    } else if (statusFilter === 'Cancelled') {
      query = query.eq('status', 'Cancelled');
    }
  }

  if (search) {
    query = query.or(`order_number.ilike.%${search}%,customer_notes.ilike.%${search}%`);
  }

  const { data: rawOrders, count, error } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false }) // Stable tie-breaker sort
    .range(from, to);

  if (error) {
    console.error('Error fetching Online orders:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pagination: AdminPaginationData = {
    page,
    pageSize,
    totalCount,
    totalPages,
    statusFilter,
    searchQuery: search,
  };

  // Transform raw Supabase orders to AdminOrderRow interface
  const initialLiveOrders: AdminOrderRow[] = (rawOrders || []).map((order: any) => {
    // Determine active payment attempt (sort descending by attempt_number or created_at)
    const paymentsList = Array.isArray(order.payments) ? order.payments : [];
    paymentsList.sort((a: any, b: any) => {
      const aNum = a.attempt_number ?? 0;
      const bNum = b.attempt_number ?? 0;
      return bNum - aNum;
    });
    const latestPayment = paymentsList[0] || null;

    // Calculate total quantity of items
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const totalItemQty = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
    const itemsCountText = totalItemQty === 1 ? '1 item' : `${totalItemQty} items`;

    // Map order status to displayStatus
    let displayStatus: 'Processing' | 'Shipped' | 'Pending' | 'Cancelled' = 'Pending';
    const s = String(order.status || '').toLowerCase();
    if (s.includes('ship') || s.includes('dispatch') || s === 'dispatched') {
      displayStatus = 'Shipped';
    } else if (s.includes('process') || s.includes('confirm')) {
      displayStatus = 'Processing';
    } else if (s.includes('cancel')) {
      displayStatus = 'Cancelled';
    } else {
      displayStatus = 'Pending';
    }

    // Format date as YYYY-MM-DD
    const orderDate = order.created_at ? order.created_at.split('T')[0] : 'Today';

    // Parse shipping address from snapshot
    const addr = typeof order.shipping_address_snapshot === 'object' && order.shipping_address_snapshot !== null
      ? order.shipping_address_snapshot
      : {};

    const customerName = addr.recipient_name || order.customer?.full_name || 'Customer';
    const customerEmail = order.customer?.email || 'N/A';
    const customerPhone = addr.phone || order.customer?.phone || '';

    return {
      id: order.id,
      orderNumber: order.order_number ? `#ORD-${order.order_number}` : `#ORD-${order.id.slice(0, 6)}`,
      customerName,
      customerEmail,
      customerPhone,
      itemsCountText,
      status: order.status || 'Pending Verification',
      displayStatus,
      total: Number(order.total_amount) || 0,
      currencySymbol: '₹',
      date: orderDate,
      orderType: 'online' as const,
      paymentStatus: order.payment_status || 'pending',
      itemsSubtotal: Number(order.subtotal) || 0,
      deliveryFee: order.delivery_fee != null ? Number(order.delivery_fee) : 1,
      shippingAddress: {
        recipientName: customerName,
        phone: customerPhone,
        addressLine1: addr.street_address || '',
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postal_code || '',
      },
      activePayment: latestPayment
        ? {
            id: latestPayment.id,
            utrReference: latestPayment.utr_reference,
            proofAssetId: latestPayment.proof_public_id,
            proofSecurePath: latestPayment.proof_public_id,
            status: latestPayment.verification_status,
            amountExpected: Number(latestPayment.amount_expected) || Number(order.total_amount),
            amountCredited: latestPayment.amount_submitted ? Number(latestPayment.amount_submitted) : null,
            createdAt: latestPayment.created_at,
          }
        : null,
      courierPartner: order.courier_partner,
      trackingNumber: order.tracking_number,
      isSampleData: false,
    };
  });

  return <AdminOnlineOrdersClient initialLiveOrders={initialLiveOrders} pagination={pagination} />;
}
