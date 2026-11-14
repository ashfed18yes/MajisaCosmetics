import { redirect } from 'next/navigation';
import { createClient, getCachedUser } from '@/lib/supabase/server';
import CheckoutSuccessClient from './CheckoutSuccessClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Order Confirmation | Majisa Cosmetics',
  description: 'Your luxury cosmetics order has been received and is awaiting verification.',
};

interface SuccessPageProps {
  searchParams: Promise<{
    order_id?: string;
    order_number?: string;
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const [authRes, params] = await Promise.all([
    getCachedUser(),
    searchParams,
  ]);

  const user = authRes.user;
  const { order_id: orderId, order_number: orderNumber } = params;

  if (!user || authRes.error) {
    redirect('/sign-in?redirectTo=/account');
  }

  if (!orderId && !orderNumber) {
    redirect('/account');
  }

  const supabase = await createClient();

  let query = supabase
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
      payments (
        id,
        attempt_number,
        payment_method,
        amount_expected,
        amount_submitted,
        utr_reference,
        verification_status,
        created_at
      ),
      order_items (
        id,
        product_name,
        brand_name,
        variant_name,
        quantity,
        unit_price,
        total_price,
        image_url
      )
    `)
    .eq('user_id', user.id);

  if (orderId) {
    query = query.eq('id', orderId);
  } else if (orderNumber) {
    query = query.eq('order_number', orderNumber);
  }

  const { data: order, error } = await query.maybeSingle();

  if (error || !order) {
    console.error('Order query error on success page:', error);
    redirect('/account');
  }

  // Guard against unsubmitted checkout drafts
  if (order.status === 'Awaiting Payment') {
    redirect('/checkout');
  }

  return <CheckoutSuccessClient order={order} />;
}

