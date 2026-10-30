'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Package,
  MapPin,
  LogOut,
  ChevronRight,
  ExternalLink,
  Plus,
  CheckCircle,
  Sparkles,
  Mail,
  Phone,
  MessageCircle,
  Trash2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { CONTACT_INFO } from '@/config/contact';
import { createClient } from '@/lib/supabase/client';

export interface CustomerData {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  type: 'Home' | 'Work';
  isDefault: boolean;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export interface CustomerOrderItem {
  id?: string;
  productName: string;
  brand: string;
  quantity: number;
  price: number;
  image: string;
  variant?: string;
}

export interface CustomerOrder {
  id: string;
  date: string;
  status: string;
  total: number;
  items: CustomerOrderItem[];
  trackingNumber?: string | null;
  courierPartner?: string | null;
  shippingAddress: string;
}

interface AccountClientProps {
  customer: CustomerData;
  initialAddresses: CustomerAddress[];
  initialOrders: CustomerOrder[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'MC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function splitFullName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

export default function AccountClient({
  customer,
  initialAddresses,
  initialOrders,
}: AccountClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('orders');
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);
  const [orders] = useState<CustomerOrder[]>(initialOrders);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Profile Edit State
  const initialSplit = splitFullName(customer.fullName);
  const [profileFirstName, setProfileFirstName] = useState(initialSplit.firstName);
  const [profileLastName, setProfileLastName] = useState(initialSplit.lastName);
  const [profilePhone, setProfilePhone] = useState(customer.phone);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [currentFullName, setCurrentFullName] = useState(customer.fullName);

  // Address Create State
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const [newAddress, setNewAddress] = useState({
    name: customer.fullName || '',
    street: '',
    city: '',
    state: 'Rajasthan',
    postalCode: '',
    phone: customer.phone || '',
    type: 'Home' as 'Home' | 'Work',
  });

  const initials = getInitials(currentFullName);
  const memberSinceYear = customer.createdAt
    ? new Date(customer.createdAt).getFullYear()
    : new Date().getFullYear();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
      router.push('/');
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    const combinedName = `${profileFirstName.trim()} ${profileLastName.trim()}`.trim();
    if (!combinedName) {
      setProfileError('Please provide your full name.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('You must be signed in to update your profile.');

      // Update public.profiles (RLS enforced: id = auth.uid())
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: combinedName,
          phone: profilePhone.trim() || null,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Keep user metadata in sync
      await supabase.auth.updateUser({
        data: {
          full_name: combinedName,
          name: combinedName,
          phone: profilePhone.trim() || null,
        },
      });

      setCurrentFullName(combinedName);
      setProfileSuccess('Your personal profile has been updated successfully.');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile details.';
      setProfileError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    if (
      !newAddress.name.trim() ||
      !newAddress.street.trim() ||
      !newAddress.city.trim() ||
      !newAddress.phone.trim()
    ) {
      setAddressError('Please fill in all mandatory address fields.');
      return;
    }

    if (addresses.length >= 15) {
      setAddressError('Maximum address limit reached. You cannot save more than 15 delivery addresses.');
      return;
    }

    setIsSavingAddress(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('You must be signed in to save an address.');

      const isFirst = addresses.length === 0;

      const { data: inserted, error: insertError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          recipient_name: newAddress.name.trim(),
          street_address: newAddress.street.trim(),
          city: newAddress.city.trim(),
          state: newAddress.state.trim() || 'Rajasthan',
          postal_code: newAddress.postalCode.trim() || '302001',
          phone: newAddress.phone.trim(),
          address_type: newAddress.type,
          is_default: isFirst,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const savedAddress: CustomerAddress = {
        id: inserted.id,
        type: inserted.address_type,
        isDefault: inserted.is_default,
        name: inserted.recipient_name,
        street: inserted.street_address,
        city: inserted.city,
        state: inserted.state,
        postalCode: inserted.postal_code,
        phone: inserted.phone,
      };

      setAddresses((prev) => [savedAddress, ...prev]);
      setShowAddressModal(false);
      setNewAddress({
        name: currentFullName || '',
        street: '',
        city: '',
        state: 'Rajasthan',
        postalCode: '',
        phone: customer.phone || '',
        type: 'Home',
      });
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save address.';
      setAddressError(message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you wish to delete this saved delivery address?')) return;
    setDeletingAddressId(id);
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase.from('addresses').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      router.refresh();
    } catch (err) {
      console.error('Delete address error:', err);
    } finally {
      setDeletingAddressId(null);
    }
  };

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-12 space-y-9">
      {/* 1. Distinct White Profile Summary Card with Generous Padding & Soft Elevation */}
      <div className="bg-white rounded-[24px] sm:rounded-[26px] p-5 sm:p-7 border border-[#D4E5E3] shadow-[0_14px_35px_rgba(11,65,69,0.08)] flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#DDF3F2] border-4 border-white flex items-center justify-center text-[#0B4145] font-serif text-2xl sm:text-3xl font-bold shrink-0 shadow-[0_8px_20px_rgba(11,65,69,0.08)]">
            {initials}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="font-serif text-2xl sm:text-3xl text-[#0B4145] font-bold">
                {currentFullName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF3F2] text-[#128F92] text-xs font-bold tracking-wider uppercase border border-[#128F92]/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#128F92]" />
                <span>Privilege Member</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#687F8D] font-medium">
              {customer.email} &bull; Client since {memberSinceYear}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-2 px-4.5 py-2 rounded-full border border-[#DDF3F2] hover:border-red-300 text-[#687F8D] hover:text-red-700 text-xs sm:text-sm font-bold transition-all bg-[#F0F9F8] hover:bg-red-50/50 shadow-xs disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
        </button>
      </div>

      {/* Main Grid: Tabs & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3">
          <div className="bg-white rounded-[24px] p-2.5 border border-[#D4E5E3] shadow-card space-y-1.5">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#128F92] text-white shadow-cta'
                  : 'text-[#102F32] hover:bg-[#F0F9F8]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4.5 h-4.5" />
                <span>Order History</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'orders'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#DDF3F2] text-[#128F92]'
                }`}
              >
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#128F92] text-white shadow-cta'
                  : 'text-[#102F32] hover:bg-[#F0F9F8]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4.5 h-4.5" />
                <span>Personal Profile</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : 'text-[#687F8D]'}`}
              />
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'addresses'
                  ? 'bg-[#128F92] text-white shadow-cta'
                  : 'text-[#102F32] hover:bg-[#F0F9F8]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4.5 h-4.5" />
                <span>Saved Addresses</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'addresses'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#DDF3F2] text-[#128F92]'
                }`}
              >
                {addresses.length}
              </span>
            </button>
          </div>
        </aside>

        {/* Content Pane */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-6 sm:space-y-7">
              {/* Heading with Clear Visual Gap */}
              <div className="pb-1">
                <h2 className="font-serif text-2xl sm:text-3xl text-[#0B4145] font-bold">
                  Order History
                </h2>
                <p className="text-xs sm:text-sm text-[#687F8D] mt-1 font-medium">
                  Review complete order summaries, live shipment tracking, and official invoices.
                </p>
              </div>

              {/* Order Cards List or Empty State */}
              {orders.length === 0 ? (
                <div className="bg-white rounded-[22px] sm:rounded-[24px] p-8 sm:p-12 border border-[#D4E5E3] shadow-card text-center space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#DDF3F2] mx-auto flex items-center justify-center text-[#128F92]">
                    <Package className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.8]" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DDF3F2] text-[#128F92] text-xs uppercase font-extrabold tracking-wider">
                      Acquisitions & Deliveries
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B4145]">
                      No Orders Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#687F8D] font-medium leading-relaxed">
                      You have not placed any orders yet. Once an order is confirmed, its live status,
                      items, courier tracking, and invoices will appear here.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/collections"
                      className="inline-flex items-center gap-2 h-[44px] sm:h-[46px] px-7 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold shadow-cta transition-all"
                    >
                      <span>Explore Collections</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-[22px] sm:rounded-[24px] p-5 sm:p-7 border border-[#D4E5E3] shadow-[0_12px_35px_rgba(11,65,69,0.08)] hover:shadow-hover transition-all duration-300 space-y-4.5"
                    >
                      {/* Structured Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DDF3F2]">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-serif text-xl sm:text-2xl font-bold text-[#0B4145]">
                            {order.id}
                          </span>
                          <span className="text-xs text-[#687F8D] font-bold bg-[#F0F9F8] px-3 py-1 rounded-full border border-[#DDF3F2]">
                            Placed on {order.date}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{order.status}</span>
                          </span>
                          <span className="text-lg sm:text-xl font-extrabold text-[#0B4145]">
                            ₹{order.total.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Order Items List */}
                      <div className="divide-y divide-[#DDF3F2]">
                        {order.items.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-[#F0F9F8] shrink-0 border border-[#DDF3F2] p-1.5 flex items-center justify-center">
                                <Image
                                  src={item.image || '/placeholder-product.jpg'}
                                  alt={item.productName}
                                  fill
                                  sizes="80px"
                                  className="object-contain p-1"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[11px] uppercase tracking-wider text-[#128F92] font-extrabold">
                                  {item.brand}
                                </p>
                                <p className="text-sm sm:text-base font-bold text-[#102F32] line-clamp-1 leading-snug">
                                  {item.productName}
                                </p>
                                {item.variant && (
                                  <p className="text-xs text-[#687F8D] font-medium">
                                    Variant:{' '}
                                    <span className="font-semibold text-[#102F32]">
                                      {item.variant}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-sm sm:text-base font-bold text-[#0B4145] block">
                                ₹{item.price.toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs text-[#687F8D] font-semibold">
                                Qty: {item.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Distinct Separated Footer Area: Address & Tracking Link */}
                      <div className="bg-[#F0F9F8] rounded-[16px] p-3.5 sm:p-4 border border-[#DDF3F2] flex flex-wrap items-center justify-between gap-3 mt-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#687F8D] font-medium">
                          <MapPin className="w-4 h-4 text-[#128F92] shrink-0" />
                          <span>
                            Shipped To:{' '}
                            <strong className="font-bold text-[#102F32]">
                              {order.shippingAddress}
                            </strong>
                          </span>
                        </div>

                        {order.trackingNumber && (
                          <div className="inline-flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-[#DDF3F2] shadow-xs text-[#128F92] text-xs font-bold hover:text-[#0B4145] transition-colors cursor-pointer">
                            <span>
                              {order.courierPartner ? `${order.courierPartner}: ` : ''}
                              Live Tracking: {order.trackingNumber}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Order Support & Contact Row */}
                      <div className="pt-3.5 border-t border-[#DDF3F2] flex flex-wrap items-center justify-between gap-2.5 text-xs">
                        <span className="text-[#687F8D] font-medium">
                          Need assistance regarding order {order.id}?
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={CONTACT_INFO.whatsappOrderLink(order.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] border border-[#D4E5E3] font-bold transition-all shadow-xs text-xs"
                            aria-label={`WhatsApp support regarding order ${order.id}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#128F92]" />
                            <span>WhatsApp Support</span>
                          </a>

                          <a
                            href={CONTACT_INFO.emailOrderLink(order.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] border border-[#D4E5E3] font-bold transition-all shadow-xs text-xs"
                            aria-label={`Email support regarding order ${order.id}`}
                          >
                            <Mail className="w-3.5 h-3.5 text-[#128F92]" />
                            <span>Email Support</span>
                          </a>

                          <a
                            href={CONTACT_INFO.phoneLink}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] border border-[#D4E5E3] font-bold transition-all shadow-xs text-xs"
                            aria-label={`Call helpline regarding order ${order.id}`}
                          >
                            <Phone className="w-3.5 h-3.5 text-[#128F92]" />
                            <span>Call Helpline</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dedicated Customer Support Card */}
              <div className="bg-white rounded-[22px] sm:rounded-[24px] p-5 sm:p-6 border border-[#D4E5E3] shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DDF3F2] text-[#128F92] text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#128F92]" />
                    <span>Official Customer Concierge</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-[#0B4145] font-bold">
                    Have Questions About an Order?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#687F8D] font-medium max-w-xl">
                    Our beauty advisors and order specialists are available directly via phone, WhatsApp, or email.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <a
                    href={CONTACT_INFO.phoneLink}
                    className="h-[42px] sm:h-[44px] px-5 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase tracking-wider font-bold transition-all shadow-cta inline-flex items-center gap-2"
                    aria-label={`Call ${CONTACT_INFO.businessName} at ${CONTACT_INFO.phone}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{CONTACT_INFO.phone}</span>
                  </a>
                  <a
                    href={CONTACT_INFO.emailLink}
                    className="h-[42px] sm:h-[44px] px-5 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] border border-[#D4E5E3] text-xs uppercase tracking-wider font-bold transition-all shadow-card inline-flex items-center gap-2"
                    aria-label={`Send Email to ${CONTACT_INFO.email}`}
                  >
                    <Mail className="w-3.5 h-3.5 text-[#128F92]" />
                    <span>Send Email</span>
                  </a>
                  <a
                    href={CONTACT_INFO.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-[42px] sm:h-[44px] px-5 rounded-full bg-[#0B4145] hover:bg-[#128F92] text-white text-xs uppercase tracking-wider font-bold transition-all shadow-card inline-flex items-center gap-2"
                    aria-label="Chat with Majisa Cosmetics on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#DDF3F2]" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-[22px] sm:rounded-[24px] p-5 sm:p-7 border border-[#D4E5E3] shadow-card space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B4145]">
                  Personal Information
                </h2>
                <p className="text-xs sm:text-sm text-[#687F8D] mt-1 font-medium">
                  Update your contact details and communication preferences.
                </p>
              </div>

              {profileSuccess && (
                <div className="p-3.5 rounded-xl bg-[#DDF3F2] border border-[#128F92]/30 text-xs sm:text-sm text-[#0B4145] font-semibold flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#128F92] shrink-0 mt-0.5" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 animate-in fade-in">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileLastName}
                      onChange={(e) => setProfileLastName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                      Email Address (Managed via Auth)
                    </label>
                    <input
                      type="email"
                      value={customer.email}
                      disabled
                      className="w-full px-4 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32]/60 focus:outline-none cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+91 98290 00000"
                      className="w-full px-4 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#DDF3F2] flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="h-[44px] sm:h-[46px] px-7 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold shadow-cta transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {isSavingProfile ? <span>Saving Changes...</span> : <span>Save Profile Changes</span>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B4145]">
                    Saved Delivery Addresses
                  </h2>
                  <p className="text-xs sm:text-sm text-[#687F8D] mt-1 font-medium">
                    Manage destination addresses for fast royal checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (addresses.length >= 15) {
                      setAddressError('Maximum limit of 15 saved addresses reached. Please remove an existing address to add a new one.');
                      return;
                    }
                    setAddressError('');
                    setShowAddressModal(true);
                  }}
                  className={`inline-flex items-center gap-2 h-[44px] sm:h-[46px] px-6 rounded-full text-xs sm:text-sm uppercase tracking-wider font-bold transition-all self-start sm:self-auto ${
                    addresses.length >= 15
                      ? 'bg-gray-100 text-[#687F8D] border border-[#DDF3F2] cursor-not-allowed'
                      : 'bg-[#128F92] hover:bg-[#0B4145] text-white shadow-cta'
                  }`}
                  title={addresses.length >= 15 ? 'Maximum limit of 15 addresses reached' : undefined}
                >
                  <Plus className="w-4 h-4" />
                  <span>{addresses.length >= 15 ? 'Limit Reached (15/15)' : 'Add New Address'}</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="bg-white rounded-[22px] sm:rounded-[24px] p-8 sm:p-12 border border-[#D4E5E3] shadow-card text-center space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#DDF3F2] mx-auto flex items-center justify-center text-[#128F92]">
                    <MapPin className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.8]" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DDF3F2] text-[#128F92] text-xs uppercase font-extrabold tracking-wider">
                      Delivery Destinations
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B4145]">
                      No Saved Addresses
                    </h3>
                    <p className="text-xs sm:text-sm text-[#687F8D] font-medium leading-relaxed">
                      You have not added any delivery addresses yet. Add a destination address now
                      for seamless, one-click royal checkout.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAddressError('');
                        setShowAddressModal(true);
                      }}
                      className="inline-flex items-center gap-2 h-[44px] sm:h-[46px] px-7 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold shadow-cta transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Address</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="bg-white rounded-[20px] p-5 sm:p-6 border border-[#D4E5E3] shadow-card space-y-2.5 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-block px-3 py-1 rounded-full bg-[#DDF3F2] text-xs uppercase font-extrabold text-[#128F92]">
                          {addr.type}
                        </span>
                        <div className="flex items-center gap-2">
                          {addr.isDefault && (
                            <span className="text-xs font-bold text-[#0B4145] bg-[#F0F9F8] px-3 py-1 rounded-full border border-[#DDF3F2]">
                              Default
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            disabled={deletingAddressId === addr.id}
                            className="p-1.5 text-[#687F8D] hover:text-red-600 rounded-full hover:bg-red-50 transition-colors disabled:opacity-40"
                            aria-label={`Delete address for ${addr.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-serif text-lg sm:text-xl font-bold text-[#0B4145]">
                        {addr.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#687F8D] leading-relaxed font-medium">
                        {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="text-xs sm:text-sm text-[#687F8D] font-bold">
                        Phone: {addr.phone}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Address Modal */}
              {showAddressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B4145]/40 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-white rounded-[24px] sm:rounded-[26px] p-6 sm:p-8 max-w-lg w-full border border-[#D4E5E3] shadow-modal space-y-4">
                    <h3 className="font-serif text-2xl font-bold text-[#0B4145]">
                      Add New Address
                    </h3>

                    {addressError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700">
                        {addressError}
                      </div>
                    )}

                    <form onSubmit={handleAddAddress} className="space-y-3.5">
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddress.name}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, name: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddress.street}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, street: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddress.city}
                            onChange={(e) =>
                              setNewAddress({ ...newAddress, city: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1">
                            Postal Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddress.postalCode}
                            onChange={(e) =>
                              setNewAddress({ ...newAddress, postalCode: e.target.value })
                            }
                            placeholder="302001"
                            className="w-full px-3.5 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddress.state}
                            onChange={(e) =>
                              setNewAddress({ ...newAddress, state: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={newAddress.phone}
                            onChange={(e) =>
                              setNewAddress({ ...newAddress, phone: e.target.value })
                            }
                            placeholder="+91 98290 00000"
                            className="w-full px-3.5 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2.5 pt-3">
                        <button
                          type="button"
                          onClick={() => setShowAddressModal(false)}
                          className="h-[42px] px-5 rounded-full text-xs font-bold uppercase border border-[#DDF3F2] text-[#687F8D] hover:bg-[#F0F9F8]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingAddress}
                          className="h-[42px] px-7 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase font-bold shadow-cta transition-all disabled:opacity-60"
                        >
                          {isSavingAddress ? 'Saving...' : 'Save Address'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
