import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUpiPaymentConfig } from './actions';
import CheckoutClient from './CheckoutClient';
import type { CustomerAddress } from '@/app/account/AccountClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Secure Checkout | Majisa Cosmetics',
  description: 'Complete your luxury cosmetics order with secure UPI payment verification.',
};

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/sign-in?redirectTo=/checkout');
  }

  // 1. Fetch customer profile for default recipient info
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, email')
    .eq('id', user.id)
    .maybeSingle();

  // 2. Fetch customer's saved addresses under RLS
  const { data: rawAddresses } = await supabase
    .from('addresses')
    .select(
      'id, address_type, is_default, recipient_name, street_address, city, state, postal_code, phone, created_at'
    )
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  // 3. Fetch store delivery charge setting (defaults to Rs 100)
  const { data: deliverySetting } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'delivery_charges')
    .maybeSingle();

  let deliveryFee = 100.0;
  if (deliverySetting?.value && typeof deliverySetting.value === 'object') {
    const settingVal = deliverySetting.value as {
      delivery_fee?: number;
      is_active?: boolean;
    };
    if (settingVal.delivery_fee !== undefined) {
      deliveryFee = Number(settingVal.delivery_fee);
    }
  }

  // 4. Verify UPI configuration
  const upiConfig = await getUpiPaymentConfig();

  const savedAddresses: CustomerAddress[] = (rawAddresses || []).map((addr) => ({
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

  const customerProfile = {
    fullName: profile?.full_name || user.user_metadata?.full_name || '',
    phone: profile?.phone || user.user_metadata?.phone || '',
    email: profile?.email || user.email || '',
  };

  return (
    <CheckoutClient
      savedAddresses={savedAddresses}
      customerProfile={customerProfile}
      deliveryFee={deliveryFee}
      upiConfig={upiConfig}
    />
  );
}

