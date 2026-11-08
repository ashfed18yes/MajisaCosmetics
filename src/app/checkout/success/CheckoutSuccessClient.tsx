'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Truck,
  FileText,
} from 'lucide-react';

interface SuccessClientProps {
  order: any;
}

export default function CheckoutSuccessClient({ order }: SuccessClientProps) {
  // Sort payments to get the latest attempt
  const rawPayments = Array.isArray(order.payments) ? [...order.payments] : [];
  rawPayments.sort((a, b) => (b.attempt_number || 0) - (a.attempt_number || 0));
  const latestPayment = rawPayments[0];

  const isOnline = order.order_type === 'online';
  const subtotal = Number(order.subtotal) || 0;
  const deliveryFee = Number(order.delivery_fee) || 0;
  const totalAmount = Number(order.total_amount) || 0;
  const balanceDue = Number(order.balance_amount_due) || 0;
  const advancePaid = Number(order.advance_amount_paid) || 0;

  const addressSnapshot =
    typeof order.shipping_address_snapshot === 'object' &&
    order.shipping_address_snapshot !== null
      ? (order.shipping_address_snapshot as Record<string, string>)
      : null;

  const items = Array.isArray(order.order_items) ? order.order_items : [];

  return (
    <div className="min-h-screen bg-ivory-50 text-charcoal-900 py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Banner Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-ivory-200 shadow-card text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <CheckCircle2 className="w-7 h-7 stroke-[1.75]" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-plum-50 text-plum-900 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-rosegold-400" />
              <span>Order Received</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-plum-950">
              Thank You for Your Order
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-600 font-light max-w-md mx-auto leading-relaxed">
              Your payment proof has been securely recorded. Our finance team will verify the bank transaction before dispatch.
            </p>
          </div>

          {/* Reference Pill */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs">
            <div>
              <span className="text-charcoal-500 font-light">Order Number: </span>
              <strong className="font-mono text-xs sm:text-sm text-plum-950 font-bold ml-1">
                {order.order_number}
              </strong>
            </div>
            <span className="hidden sm:inline text-charcoal-300">|</span>
            <div>
              <span className="text-charcoal-500 font-light">Status: </span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 ml-1 text-xs">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>{order.status || 'Pending Verification'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Payment & Verification Accounting Panel */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-ivory-200 shadow-card space-y-4">
          <div className="flex items-center gap-3 border-b border-ivory-100 pb-3">
            <div className="w-9 h-9 rounded-lg bg-plum-50 flex items-center justify-center text-plum-900 shrink-0">
              {isOnline ? (
                <CreditCard className="w-4.5 h-4.5" />
              ) : (
                <Truck className="w-4.5 h-4.5" />
              )}
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-charcoal-900">
                {isOnline
                  ? 'Online UPI Order — Verification Pending'
                  : 'Cash on Delivery — ₹100 Advance Verification Pending'}
              </h2>
              <p className="text-[11px] sm:text-xs text-charcoal-500 font-light">
                {isOnline
                  ? 'Full order amount paid via dynamic UPI QR'
                  : '₹100 fixed delivery fee paid via UPI; product amount due at doorstep'}
              </p>
            </div>
          </div>

          {/* Verification Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1.5">
              <span className="text-charcoal-500 font-light block text-[11px]">
                Submitted UTR Reference:
              </span>
              <p className="font-mono text-xs sm:text-sm font-bold text-plum-900">
                {latestPayment?.utr_reference || 'Submitted'}
              </p>
              <p className="text-[11px] text-charcoal-500 font-light">
                Verification state:{' '}
                <strong className="text-amber-800 uppercase tracking-wide">
                  {latestPayment?.verification_status || 'Pending'}
                </strong>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1.5">
              <span className="text-charcoal-500 font-light block text-[11px]">
                Payment Breakdown:
              </span>
              {isOnline ? (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Total Submitted:</span>
                    <strong className="font-bold text-plum-900">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Balance on Delivery:</span>
                    <strong className="font-bold">₹0.00 (Fully Paid)</strong>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Advance Fee Submitted:</span>
                    <strong className="font-bold text-plum-900">
                      ₹{deliveryFee.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>Balance Due at Doorstep:</span>
                    <strong className="font-bold">
                      ₹{balanceDue.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Explanation Alert */}
          <div className="p-3 rounded-xl bg-plum-50/50 border border-plum-100 text-xs text-plum-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4.5 h-4.5 text-plum-800 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-semibold text-xs">What happens next?</p>
              <p className="font-light text-[11px] sm:text-xs">
                {isOnline
                  ? 'Our accounts department independently validates your transaction against our bank statement. Once verified, your order will transition to Confirmed and be handed over to our courier partner.'
                  : `Our team will verify your ₹100 delivery advance. Once verified, your parcel will be dispatched. You will pay the remaining ₹${balanceDue.toLocaleString(
                      'en-IN'
                    )} in cash to the delivery agent upon receiving the package.`}
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Address Snapshot & Items Summary */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-ivory-200 shadow-card space-y-4">
          <div className="flex items-center gap-3 border-b border-ivory-100 pb-3">
            <div className="w-9 h-9 rounded-lg bg-ivory-100 flex items-center justify-center text-charcoal-700 shrink-0">
              <Package className="w-4.5 h-4.5" />
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-charcoal-900">
              Parcel Details
            </h2>
          </div>

          {/* Address Snapshot */}
          {addressSnapshot && (
            <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-plum-900" />
                <span className="font-bold text-charcoal-900">
                  {addressSnapshot.recipient_name}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-ivory-200 text-charcoal-700">
                  {addressSnapshot.address_type || 'Home'}
                </span>
              </div>
              <p className="text-charcoal-600 font-light pl-5 text-[11px] sm:text-xs">
                {addressSnapshot.street_address}, {addressSnapshot.city},{' '}
                {addressSnapshot.state} - {addressSnapshot.postal_code}
              </p>
              <p className="text-charcoal-500 font-light pl-5 text-[11px]">
                Contact: {addressSnapshot.phone}
              </p>
            </div>
          )}

          {/* Line Items */}
          <div className="divide-y divide-ivory-100">
            {items.map((item: any) => (
              <div key={item.id} className="py-2.5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-ivory-100 overflow-hidden shrink-0 border border-ivory-200 relative">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-charcoal-400 text-xs">
                      MC
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <h4 className="font-semibold text-charcoal-900 truncate">
                    {item.product_name}
                  </h4>
                  <p className="text-charcoal-500 text-[11px] truncate">
                    {item.variant_name
                      ? `Variant: ${item.variant_name}`
                      : item.brand_name || 'Majisa Signature'}
                  </p>
                  <p className="text-charcoal-600 mt-0.5 text-[11px]">
                    Qty: {item.quantity} × ₹{Number(item.unit_price).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="font-medium text-xs text-charcoal-900">
                  ₹{Number(item.total_price).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <Link
            href="/account"
            className="w-full sm:flex-1 h-10 sm:h-11 rounded-full bg-plum-900 hover:bg-plum-950 text-white text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <FileText className="w-4 h-4" />
            <span>View Order in Account</span>
          </Link>

          <Link
            href="/collections"
            className="w-full sm:flex-1 h-10 sm:h-11 rounded-full bg-white hover:bg-ivory-100 border border-ivory-300 text-charcoal-800 text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

