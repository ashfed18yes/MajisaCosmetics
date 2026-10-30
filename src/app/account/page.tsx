import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AccountClient, {
  type CustomerData,
  type CustomerAddress,
  type CustomerOrder,
} from './AccountClient';

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/sign-in?redirectTo=/account');
  }

  // 1. Fetch customer profile from public.profiles
  // RLS ensures the authenticated user can only access their own profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, avatar_url, created_at')
    .eq('id', user.id)
    .maybeSingle();

  // 2. Fetch customer addresses from public.addresses
  // RLS ensures only addresses belonging to user_id = auth.uid() are returned
  const { data: rawAddresses } = await supabase
    .from('addresses')
    .select('id, address_type, is_default, recipient_name, street_address, city, state, postal_code, phone, created_at')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  // 3. Fetch customer orders and order items from public.orders
  // RLS ensures only orders belonging to user_id = auth.uid() are returned
  const { data: rawOrders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      subtotal,
      delivery_fee,
      total_amount,
      shipping_address_snapshot,
      tracking_number,
      courier_partner,
      created_at,
      order_items (
        id,
        product_name,
        brand_name,
        variant_name,
        unit_price,
        quantity,
        total_price,
        image_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    'Valued Customer';

  const customer: CustomerData = {
    id: user.id,
    email: user.email ?? profile?.email ?? '',
    fullName,
    phone: profile?.phone || user.user_metadata?.phone || '',
    createdAt: user.created_at,
  };

  const initialAddresses: CustomerAddress[] = (rawAddresses || []).map((addr) => ({
    id: addr.id,
    type: (addr.address_type as 'Home' | 'Work') || 'Home',
    isDefault: addr.is_default,
    name: addr.recipient_name,
    street: addr.street_address,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postal_code,
    phone: addr.phone,
  }));

  const initialOrders: CustomerOrder[] = (rawOrders || []).map((order) => {
    let shippingText = '';
    if (typeof order.shipping_address_snapshot === 'object' && order.shipping_address_snapshot !== null) {
      const snap = order.shipping_address_snapshot as Record<string, string>;
      shippingText = [
        snap.recipient_name ? `${snap.recipient_name}:` : '',
        snap.street_address,
        snap.city,
        snap.state,
        snap.postal_code,
      ]
        .filter(Boolean)
        .join(', ');
    } else if (typeof order.shipping_address_snapshot === 'string') {
      shippingText = order.shipping_address_snapshot;
    }

    return {
      id: order.order_number || order.id,
      date: new Date(order.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      status: order.status,
      total: Number(order.total_amount) || 0,
      trackingNumber: order.tracking_number,
      courierPartner: order.courier_partner,
      shippingAddress: shippingText || 'Standard Delivery Destination',
      items: (order.order_items || []).map((item) => ({
        id: item.id,
        productName: item.product_name,
        brand: item.brand_name,
        quantity: item.quantity,
        price: Number(item.unit_price) || 0,
        variant: item.variant_name || undefined,
        image: item.image_url,
      })),
    };
  });

  return (
    <AccountClient
      customer={customer}
      initialAddresses={initialAddresses}
      initialOrders={initialOrders}
    />
  );
}
