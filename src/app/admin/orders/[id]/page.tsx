import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import OrderDetailsClient, { OrderDetailsData } from './OrderDetailsClient';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `Order Details | MajisaAdmin`,
    description: `Manage order fulfillment and payment verification for order ${id}.`,
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminOrderDetailsPage({ params }: PageProps) {
  const [, { id }] = await Promise.all([
    requireAdmin(),
    params,
  ]);

  if (!id || !isValidUuid(id)) {
    notFound();
  }

  const adminClient = createAdminClient();

  const { data: rawOrder, error } = await adminClient
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
      cod_collected_at,
      shipping_address_snapshot,
      customer_notes,
      courier_partner,
      tracking_number,
      dispatched_at,
      delivered_at,
      cancelled_at,
      created_at,
      updated_at,
      customer:profiles!orders_user_id_fkey ( id, full_name, email, phone ),
      order_items ( id, product_id, variant_id, product_name, brand_name, variant_name, unit_price, quantity, total_price, image_url ),
      payments (
        id,
        attempt_number,
        payment_method,
        amount_expected,
        amount_submitted,
        advance_amount,
        balance_amount,
        utr_reference,
        proof_public_id,
        proof_file_format,
        verification_status,
        verified_at,
        rejection_reason,
        rejected_at,
        admin_notes,
        created_at
      ),
      order_collections (
        id,
        collection_type,
        amount_collected,
        collected_at,
        payment_method,
        transaction_reference,
        admin_notes,
        created_at,
        collector:profiles!order_collections_collected_by_fkey ( full_name, email )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching order details:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    notFound();
  }

  if (!rawOrder) {
    notFound();
  }

  // Parse shipping address from JSONB snapshot
  const addr = typeof rawOrder.shipping_address_snapshot === 'object' && rawOrder.shipping_address_snapshot !== null
    ? rawOrder.shipping_address_snapshot
    : {};

  // Safely extract customer profile (handles object or single-item array from Supabase relation)
  const rawCustomer = Array.isArray(rawOrder.customer)
    ? rawOrder.customer[0]
    : (rawOrder.customer as any);

  const recipientName = addr.recipient_name || rawCustomer?.full_name || 'Customer';
  const phone = addr.phone || rawCustomer?.phone || '';

  // Sort payments descending by attempt_number
  const rawPayments = Array.isArray(rawOrder.payments) ? rawOrder.payments : [];
  rawPayments.sort((a: any, b: any) => (b.attempt_number ?? 0) - (a.attempt_number ?? 0));

  // Determine collection record if present (one per order)
  const collectionList = Array.isArray(rawOrder.order_collections) ? rawOrder.order_collections : [];
  const rawCollection = collectionList[0] || null;
  const rawCollector = rawCollection?.collector
    ? (Array.isArray(rawCollection.collector) ? rawCollection.collector[0] : (rawCollection.collector as any))
    : null;

  const normalizedOrder: OrderDetailsData = {
    id: rawOrder.id,
    orderNumber: rawOrder.order_number ? `#ORD-${rawOrder.order_number}` : `#ORD-${rawOrder.id.slice(0, 6)}`,
    orderType: rawOrder.order_type as 'online' | 'cod',
    status: rawOrder.status || 'Pending Verification',
    paymentStatus: rawOrder.payment_status || 'pending',
    subtotal: Number(rawOrder.subtotal) || 0,
    deliveryFee: rawOrder.delivery_fee != null ? Number(rawOrder.delivery_fee) : 1,
    totalAmount: Number(rawOrder.total_amount) || 0,
    advanceAmountPaid: Number(rawOrder.advance_amount_paid) || 0,
    balanceAmountDue: Number(rawOrder.balance_amount_due) || 0,
    codBalanceCollected: Number(rawOrder.cod_balance_collected) || 0,
    codCollectedAt: rawOrder.cod_collected_at,
    customerNotes: rawOrder.customer_notes,
    courierPartner: rawOrder.courier_partner,
    trackingNumber: rawOrder.tracking_number,
    dispatchedAt: rawOrder.dispatched_at,
    deliveredAt: rawOrder.delivered_at,
    cancelledAt: rawOrder.cancelled_at,
    createdAt: rawOrder.created_at,
    updatedAt: rawOrder.updated_at,
    customer: rawCustomer
      ? {
          id: rawCustomer.id,
          fullName: rawCustomer.full_name,
          email: rawCustomer.email,
          phone: rawCustomer.phone,
        }
      : null,
    shippingAddress: {
      recipientName,
      streetAddress: addr.street_address || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postal_code || '',
      phone,
      addressType: addr.address_type,
    },
    items: (rawOrder.order_items || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      productName: item.product_name,
      brandName: item.brand_name || 'Majisa',
      variantName: item.variant_name,
      unitPrice: Number(item.unit_price) || 0,
      quantity: Number(item.quantity) || 1,
      totalPrice: Number(item.total_price) || 0,
      imageUrl: item.image_url || '',
    })),
    payments: rawPayments.map((p: any) => ({
      id: p.id,
      attemptNumber: p.attempt_number ?? 1,
      paymentMethod: p.payment_method || 'online_qr',
      amountExpected: Number(p.amount_expected) || 0,
      amountSubmitted: Number(p.amount_submitted) || 0,
      advanceAmount: Number(p.advance_amount) || 0,
      balanceAmount: Number(p.balance_amount) || 0,
      utrReference: p.utr_reference,
      proofPublicId: p.proof_public_id,
      proofFileFormat: p.proof_file_format,
      verificationStatus: p.verification_status || 'pending',
      verifiedAt: p.verified_at,
      rejectionReason: p.rejection_reason,
      rejectedAt: p.rejected_at,
      adminNotes: p.admin_notes,
      createdAt: p.created_at,
    })),
    codCollection: rawCollection
      ? {
          id: rawCollection.id,
          collectionType: rawCollection.collection_type,
          amountCollected: Number(rawCollection.amount_collected) || 0,
          collectedAt: rawCollection.collected_at,
          paymentMethod: rawCollection.payment_method || 'cash',
          transactionReference: rawCollection.transaction_reference,
          adminNotes: rawCollection.admin_notes,
          createdAt: rawCollection.created_at,
          collector: rawCollector
            ? {
                fullName: rawCollector.full_name,
                email: rawCollector.email,
              }
            : null,
        }
      : null,
  };

  return <OrderDetailsClient initialOrder={normalizedOrder} />;
}
