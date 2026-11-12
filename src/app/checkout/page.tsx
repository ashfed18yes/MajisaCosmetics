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

  // Parallelize independent queries: profile, saved addresses, delivery setting, and UPI configuration
  const [profileRes, addressesRes, deliveryRes, upiConfig] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('addresses')
      .select(
        'id, address_type, is_default, recipient_name, street_address, city, state, postal_code, phone, created_at'
      )
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'delivery_charges')
      .maybeSingle(),
    getUpiPaymentConfig(),
  ]);

  const profile = profileRes.data;
  const rawAddresses = addressesRes.data;
  const deliverySetting = deliveryRes.data;

  // Default delivery fee (temporarily 1.0 for testing, restores to 100.0)
  let deliveryFee = 1.0;
  if (deliverySetting?.value && typeof deliverySetting.value === 'object') {
    const settingVal = deliverySetting.value as {
      delivery_fee?: number;
      is_active?: boolean;
    };
    if (settingVal.delivery_fee !== undefined) {
      deliveryFee = Number(settingVal.delivery_fee);
    }
  }

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

