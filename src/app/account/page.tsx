'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
} from 'lucide-react';
import { MOCK_ORDERS, MOCK_ADDRESSES } from '@/data/mockData';
import { CONTACT_INFO } from '@/config/contact';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('orders');
  const [addresses, setAddresses] = useState(MOCK_ADDRESSES);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: 'Rajasthan',
    postalCode: '',
    phone: '',
    type: 'Home' as 'Home' | 'Work',
  });

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.name || !newAddress.street || !newAddress.city) return;

    setAddresses([
      ...addresses,
      {
        id: `addr-${Date.now()}`,
        name: newAddress.name,
        street: newAddress.street,
        city: newAddress.city,
        state: newAddress.state,
        postalCode: newAddress.postalCode || '302001',
        phone: newAddress.phone || '+91 98290 00000',
        type: newAddress.type,
        isDefault: false,
      },
    ]);
    setShowAddressModal(false);
    setNewAddress({
      name: '',
      street: '',
      city: '',
      state: 'Rajasthan',
      postalCode: '',
      phone: '',
      type: 'Home',
    });
  };

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-12 space-y-9">
      {/* 1. Distinct White Profile Summary Card with Generous Padding & Soft Elevation */}
      <div className="bg-white rounded-[24px] sm:rounded-[26px] p-5 sm:p-7 border border-[#D4E5E3] shadow-[0_14px_35px_rgba(11,65,69,0.08)] flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#DDF3F2] border-4 border-white flex items-center justify-center text-[#0B4145] font-serif text-2xl sm:text-3xl font-bold shrink-0 shadow-[0_8px_20px_rgba(11,65,69,0.08)]">
            RS
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="font-serif text-2xl sm:text-3xl text-[#0B4145] font-bold">
                Rajkumari Sharma
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF3F2] text-[#128F92] text-xs font-bold tracking-wider uppercase border border-[#128F92]/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#128F92]" />
                <span>Privilege Member</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#687F8D] font-medium">
              rajkumari.sharma@example.com &bull; Client since 2024
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert('Sign out action triggered. Real auth will be connected with Supabase.')}
          className="flex items-center gap-2 px-4.5 py-2 rounded-full border border-[#DDF3F2] hover:border-red-300 text-[#687F8D] hover:text-red-700 text-xs sm:text-sm font-bold transition-all bg-[#F0F9F8] hover:bg-red-50/50 shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
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
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-[#DDF3F2] text-[#128F92]'}`}>
                {MOCK_ORDERS.length}
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
              <ChevronRight className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : 'text-[#687F8D]'}`} />
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
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'addresses' ? 'bg-white/20 text-white' : 'bg-[#DDF3F2] text-[#128F92]'}`}>
                {addresses.length}
              </span>
            </button>
          </div>
        </aside>

        {/* Content Pane */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: ORDER HISTORY - Clear Visual Separation on Standout White Cards */}
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

              {/* Distinct Separated White Order Cards */}
              <div className="space-y-6">
                {MOCK_ORDERS.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-[22px] sm:rounded-[24px] p-5 sm:p-7 border border-[#D4E5E3] shadow-[0_12px_35px_rgba(11,65,69,0.08)] hover:shadow-hover transition-all duration-300 space-y-4.5"
                  >
                    {/* Structured Order Header: ID, Date, Status, Total */}
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

                    {/* Order Items with Sharp Thumbnails & Balanced Spacing */}
                    <div className="divide-y divide-[#DDF3F2]">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-4">
                            {/* Sharp, Uncropped Product Thumbnail */}
                            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-[#F0F9F8] shrink-0 border border-[#DDF3F2] p-1.5 flex items-center justify-center">
                              <Image
                                src={item.image}
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
                                  Variant: <span className="font-semibold text-[#102F32]">{item.variant}</span>
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
                          Shipped To: <strong className="font-bold text-[#102F32]">{order.shippingAddress}</strong>
                        </span>
                      </div>

                      {order.trackingNumber && (
                        <div className="inline-flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-[#DDF3F2] shadow-xs text-[#128F92] text-xs font-bold hover:text-[#0B4145] transition-colors cursor-pointer">
                          <span>Live Tracking: {order.trackingNumber}</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Rajkumari"
                    className="w-full px-4 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Sharma"
                    className="w-full px-4 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue="rajkumari.sharma@example.com"
                    className="w-full px-4 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1.5">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    defaultValue="+91 98290 12345"
                    className="w-full px-4 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#DDF3F2] flex justify-end">
                <button
                  type="button"
                  onClick={() => alert('Profile updates will be synced with Supabase in the backend phase.')}
                  className="h-[44px] sm:h-[46px] px-7 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold shadow-cta transition-all"
                >
                  Save Profile Changes
                </button>
              </div>
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
                  onClick={() => setShowAddressModal(true)}
                  className="inline-flex items-center gap-2 h-[44px] sm:h-[46px] px-6 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold shadow-cta transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white rounded-[20px] p-5 sm:p-6 border border-[#D4E5E3] shadow-card space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-3 py-1 rounded-full bg-[#DDF3F2] text-xs uppercase font-extrabold text-[#128F92]">
                        {addr.type}
                      </span>
                      {addr.isDefault && (
                        <span className="text-xs font-bold text-[#0B4145] bg-[#F0F9F8] px-3 py-1 rounded-full border border-[#DDF3F2]">
                          Default Destination
                        </span>
                      )}
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

              {/* Add Address Modal */}
              {showAddressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B4145]/40 backdrop-blur-sm">
                  <div className="bg-white rounded-[24px] sm:rounded-[26px] p-6 sm:p-8 max-w-lg w-full border border-[#D4E5E3] shadow-modal space-y-4">
                    <h3 className="font-serif text-2xl font-bold text-[#0B4145]">Add New Address</h3>
                    <form onSubmit={handleAddAddress} className="space-y-3.5">
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddress.name}
                          onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
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
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
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
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm font-semibold text-[#102F32] focus:outline-none focus:border-[#128F92]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-wider font-extrabold text-[#102F32] mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={newAddress.postalCode}
                            onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
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
                          className="h-[42px] px-7 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase font-bold shadow-cta transition-all"
                        >
                          Save Address
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