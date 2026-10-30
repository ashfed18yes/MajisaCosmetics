'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    totalItems,
    subtotal,
    freeShippingThreshold,
  } = useCart();

  const [isMobileSummaryExpanded, setIsMobileSummaryExpanded] = useState(false);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setIsMobileSummaryExpanded(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  useEffect(() => {
    if (cart.length === 0) {
      setIsMobileSummaryExpanded(false);
    }
  }, [cart.length]);

  if (!isCartOpen) return null;

  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const shippingCost = remainingForFreeShipping === 0 ? 0 : 150;
  const estimatedTotal = subtotal + shippingCost;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Soft Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-[#0B4145]/45 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-[520px] bg-white shadow-[-14px_0_40px_rgba(11,65,69,0.14)] flex flex-col border-l border-[#D4E5E3] h-full overflow-hidden animate-in slide-in-from-right duration-300">
          
          {/* 1. Spacious Fixed Header */}
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#D4E5E3] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#DDF3F2] flex items-center justify-center text-[#128F92] shrink-0 border border-[#BCE7E5] shadow-xs">
                <ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <h2 className="text-lg sm:text-2xl font-serif font-bold text-[#0B4145]">
                    Shopping Bag
                  </h2>
                  <span className="bg-[#DDF3F2] text-[#128F92] text-[11px] sm:text-xs font-extrabold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#BCE7E5]">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <p className="text-xs text-[#687F8D] font-medium hidden sm:block">
                  Luxury Botanical Formulations
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F0F9F8] hover:bg-[#DDF3F2] text-[#0B4145] hover:text-[#128F92] flex items-center justify-center transition-all border border-[#DDF3F2] shadow-xs"
              aria-label="Close shopping bag drawer"
            >
              <X className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* 2. Compact, Balanced Free Shipping Progress */}
          {cart.length > 0 && (
            <div className="px-4 sm:px-8 pt-3.5 pb-1 shrink-0">
              <div className="p-3 sm:p-4 rounded-[18px] sm:rounded-[20px] bg-[#F0F9F8] border border-[#DDF3F2] shadow-xs space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm text-[#0B4145] font-bold">
                  <span className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-2">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#128F92] shrink-0" />
                    <span className="truncate">
                      {remainingForFreeShipping > 0
                        ? `Add ₹${remainingForFreeShipping.toLocaleString('en-IN')} for Free Delivery`
                        : 'Unlocked: Complimentary Delivery!'}
                    </span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-[#128F92] uppercase tracking-wider shrink-0">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full bg-[#DDF3F2] h-1.5 sm:h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#128F92] h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Scrolling Cart Items List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-3.5 sm:py-4 space-y-3 sm:space-y-4">
            {cart.length === 0 ? (
              <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-20 h-20 rounded-full bg-[#DDF3F2] flex items-center justify-center mb-5 text-[#128F92] border border-[#BCE7E5] shadow-soft">
                  <ShoppingBag className="w-9 h-9 stroke-[1.8]" />
                </div>
                <h3 className="font-serif text-3xl font-bold text-[#0B4145] mb-2.5">
                  Your bag is empty
                </h3>
                <p className="text-sm text-[#687F8D] max-w-xs mb-7 font-medium leading-relaxed">
                  Discover our curated collection of botanical pigments, cellular elixirs, and fine fragrances.
                </p>
                <Link
                  href="/collections"
                  onClick={() => setIsCartOpen(false)}
                  className="h-[52px] px-8 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-cta inline-flex items-center justify-center gap-2"
                >
                  <span>Explore Collections</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="relative bg-white rounded-[20px] sm:rounded-[24px] p-3 sm:p-5 border border-[#D4E5E3] shadow-card hover:shadow-hover transition-all duration-300 flex gap-3 sm:gap-5"
                >
                  {/* Top-Right Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[#687F8D] hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                    aria-label={`Remove ${item.product.name} from bag`}
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  {/* Product Thumbnail */}
                  <div className="relative w-20 h-20 sm:w-26 sm:h-26 rounded-[16px] sm:rounded-[20px] overflow-hidden bg-[#F0F9F8] shrink-0 border border-[#DDF3F2] flex items-center justify-center p-1.5 sm:p-2 shadow-xs">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      sizes="(max-width: 640px) 80px, 104px"
                      className="object-contain p-1"
                    />
                  </div>

                  {/* Product Information */}
                  <div className="flex-1 min-w-0 pr-5 sm:pr-6 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#128F92] font-extrabold mb-0.5">
                        {item.product.brand}
                      </p>
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={() => setIsCartOpen(false)}
                        className="text-xs sm:text-base font-bold text-[#0B4145] hover:text-[#128F92] line-clamp-2 leading-snug transition-colors"
                      >
                        {item.product.name}
                      </Link>

                      {/* Variant Details */}
                      {(item.selectedShade || item.selectedSize) && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          {item.selectedShade && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0F9F8] border border-[#DDF3F2] text-[10px] sm:text-[11px] font-semibold text-[#0B4145]">
                              <span className="text-[#687F8D]">Shade:</span>
                              <strong>{item.selectedShade}</strong>
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0F9F8] border border-[#DDF3F2] text-[10px] sm:text-[11px] font-semibold text-[#0B4145]">
                              <span className="text-[#687F8D]">Size:</span>
                              <strong>{item.selectedSize}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity Selector & Price */}
                    <div className="flex items-center justify-between gap-2 pt-2.5 sm:pt-3 mt-1 border-t border-[#DDF3F2]/70">
                      {/* Rounded Quantity Selector */}
                      <div className="flex items-center border border-[#D4E5E3] rounded-full bg-[#F0F9F8] p-0.5 sm:p-1 shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] hover:text-[#128F92] flex items-center justify-center transition-colors shadow-xs"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.4]" />
                        </button>
                        <span className="min-w-[24px] sm:min-w-[28px] text-center text-xs font-extrabold text-[#0B4145]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] hover:text-[#128F92] flex items-center justify-center transition-colors shadow-xs"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.4]" />
                        </button>
                      </div>

                      {/* Prominent Price */}
                      <div className="text-right">
                        <span className="text-sm sm:text-lg font-extrabold text-[#0B4145] block leading-none">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[9px] sm:text-[10px] text-[#687F8D] font-medium block mt-0.5">
                            ₹{item.product.price.toLocaleString('en-IN')} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 4. Desktop Fixed Bottom Order Summary & Checkout */}
          {cart.length > 0 && (
            <div className="hidden sm:block p-6 sm:p-8 bg-white border-t border-[#D4E5E3] shadow-[0_-10px_35px_rgba(11,65,69,0.08)] space-y-4 shrink-0">
              {/* Order Summary Container */}
              <div className="p-4 sm:p-5 rounded-[22px] bg-[#F0F9F8] border border-[#D4E5E3] space-y-2.5 text-sm font-medium">
                <div className="flex justify-between text-[#687F8D]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#0B4145]">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#687F8D]">
                  <span>Royal Shipping</span>
                  <span className={`font-bold ${remainingForFreeShipping === 0 ? 'text-[#128F92]' : 'text-[#0B4145]'}`}>
                    {remainingForFreeShipping === 0 ? 'Complimentary' : '₹150'}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-[#D4E5E3] flex justify-between items-baseline">
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-[#0B4145]">Estimated Total</span>
                    <span className="text-[11px] text-[#687F8D] font-medium">Inclusive of all duties &amp; taxes</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#128F92]">
                    ₹{estimatedTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action and Reassurance */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    alert('Order checkout will be connected with payment processing in the next phase.');
                  }}
                  className="w-full h-[62px] sm:h-[66px] px-8 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-base sm:text-lg font-bold tracking-wide transition-all flex items-center justify-center gap-3 shadow-cta hover:scale-[1.01]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#687F8D] font-medium pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#128F92]" />
                    <span>100% Genuine Formulations</span>
                  </div>
                  <span>&bull;</span>
                  <Link
                    href="/contact"
                    onClick={() => setIsCartOpen(false)}
                    className="hover:text-[#128F92] underline font-semibold"
                  >
                    Need Concierge Help?
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 5. Mobile Compact Collapsed Bottom Bar */}
          {cart.length > 0 && (
            <div className="sm:hidden border-t border-[#D4E5E3] bg-white px-4 py-3 shadow-[0_-8px_25px_rgba(11,65,69,0.08)] shrink-0 z-10 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between gap-3">
                {/* Price summary trigger */}
                <button
                  type="button"
                  onClick={() => setIsMobileSummaryExpanded(true)}
                  className="text-left group flex items-center gap-1.5 min-w-0 py-0.5"
                  aria-label="Expand order summary and details"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#687F8D]">
                      <span>Estimated Total</span>
                      <ChevronUp className="w-3.5 h-3.5 text-[#128F92] group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <div className="text-base font-extrabold text-[#0B4145] truncate">
                      ₹{estimatedTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </button>

                {/* Primary Proceed to Checkout button on mobile (expands summary) */}
                <button
                  type="button"
                  onClick={() => setIsMobileSummaryExpanded(true)}
                  className="h-[44px] px-5 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase tracking-wider font-bold transition-all shadow-cta flex items-center justify-center gap-2 shrink-0 active:scale-95"
                  aria-label="Proceed to Checkout and view breakdown"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 6. Mobile Expanded Checkout Panel Backdrop */}
          {cart.length > 0 && isMobileSummaryExpanded && (
            <div
              className="sm:hidden absolute inset-0 z-30 bg-[#0B4145]/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsMobileSummaryExpanded(false)}
              aria-label="Close order breakdown overlay"
            />
          )}

          {/* 7. Mobile Slide-Up Expanded Checkout Panel */}
          {cart.length > 0 && (
            <div
              className={`sm:hidden absolute inset-x-0 bottom-0 z-40 bg-white rounded-t-[28px] border-t border-[#D4E5E3] shadow-[0_-15px_40px_rgba(11,65,69,0.22)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto ${
                isMobileSummaryExpanded ? 'translate-y-0' : 'translate-y-full pointer-events-none'
              }`}
              role="region"
              aria-label="Order Checkout Summary"
            >
              {/* Drag Pill Indicator */}
              <div className="w-10 h-1 bg-[#D4E5E3] rounded-full mx-auto" />

              {/* Panel Header with Collapse Button */}
              <div className="flex items-center justify-between pb-2 border-b border-[#DDF3F2]">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-[#0B4145]">Order Summary</h3>
                  <span className="text-xs text-[#128F92] font-semibold bg-[#DDF3F2] px-2.5 py-0.5 rounded-full">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSummaryExpanded(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#128F92] hover:text-[#0B4145] px-3 py-1.5 rounded-full bg-[#F0F9F8] border border-[#DDF3F2] transition-colors active:scale-95"
                  aria-label="Collapse order summary"
                >
                  <span>Collapse</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Full Order Summary Container */}
              <div className="p-4 rounded-[20px] bg-[#F0F9F8] border border-[#D4E5E3] space-y-2.5 text-xs font-medium">
                <div className="flex justify-between text-[#687F8D]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#0B4145]">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#687F8D]">
                  <span>Royal Shipping</span>
                  <span className={`font-bold ${remainingForFreeShipping === 0 ? 'text-[#128F92]' : 'text-[#0B4145]'}`}>
                    {remainingForFreeShipping === 0 ? 'Complimentary' : '₹150'}
                  </span>
                </div>
                {remainingForFreeShipping > 0 && (
                  <p className="text-[11px] text-[#128F92] font-medium">
                    Add ₹{remainingForFreeShipping.toLocaleString('en-IN')} more for Complimentary Delivery
                  </p>
                )}
                <div className="pt-2.5 border-t border-[#D4E5E3] flex justify-between items-baseline">
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-[#0B4145]">Estimated Total</span>
                    <span className="text-[10px] text-[#687F8D] font-medium">Inclusive of all duties &amp; taxes</span>
                  </div>
                  <span className="text-lg font-extrabold text-[#128F92]">
                    ₹{estimatedTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action and Reassurance inside expanded panel */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    alert('Order checkout will be connected with payment processing in the next phase.');
                  }}
                  className="w-full h-[52px] px-6 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-sm uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2.5 shadow-cta active:scale-98"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-[#687F8D] font-medium">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#128F92]" />
                    <span>100% Genuine Formulations</span>
                  </div>
                  <span>&bull;</span>
                  <Link
                    href="/contact"
                    onClick={() => {
                      setIsMobileSummaryExpanded(false);
                      setIsCartOpen(false);
                    }}
                    className="hover:text-[#128F92] underline font-semibold"
                  >
                    Need Concierge Help?
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
