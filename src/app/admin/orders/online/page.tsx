import React from 'react';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminOnlineOrdersClient, { AdminOrderRow } from './AdminOnlineOrdersClient';

export const metadata = {
  title: 'Online Orders | MajisaAdmin',
  description: 'Track and manage customer online orders and manual payment verifications.',
};

export default async function AdminOnlineOrdersPage() {
  await requireAdmin();
  const adminClient = createAdminClient();

  // Query actual live online orders from Supabase with authoritative schema columns
  const { data: rawOrders, error } = await adminClient
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
      order_items ( id, product_name, quantity, unit_price, total_price ),
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
    `)
    .eq('order_type', 'online')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching Online orders:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

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
      deliveryFee: Number(order.delivery_fee) || 100,
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

  return <AdminOnlineOrdersClient initialLiveOrders={initialLiveOrders} />;
}
