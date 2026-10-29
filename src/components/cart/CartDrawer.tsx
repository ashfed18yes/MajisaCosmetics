'use client';

import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

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
        <div className="w-screen max-w-[520px] bg-white shadow-[-14px_0_40px_rgba(11,65,69,0.14)] flex flex-col border-l border-[#D4E5E3] h-full animate-in slide-in-from-right duration-300">
          
          {/* 1. Spacious Fixed Header */}
          <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-[#D4E5E3] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#DDF3F2] flex items-center justify-center text-[#128F92] shrink-0 border border-[#BCE7E5] shadow-xs">
                <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0B4145]">
                    Shopping Bag
                  </h2>
                  <span className="bg-[#DDF3F2] text-[#128F92] text-xs font-extrabold px-3 py-1 rounded-full border border-[#BCE7E5]">
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
              className="w-11 h-11 rounded-full bg-[#F0F9F8] hover:bg-[#DDF3F2] text-[#0B4145] hover:text-[#128F92] flex items-center justify-center transition-all border border-[#DDF3F2] shadow-xs"
              aria-label="Close shopping bag drawer"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* 2. Compact, Balanced Free Shipping Progress */}
          {cart.length > 0 && (
            <div className="px-6 sm:px-8 pt-4 pb-1 shrink-0">
              <div className="p-3.5 sm:p-4 rounded-[20px] bg-[#F0F9F8] border border-[#DDF3F2] shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm text-[#0B4145] font-bold">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#128F92] shrink-0" />
                    <span>
                      {remainingForFreeShipping > 0
                        ? `Add ₹${remainingForFreeShipping.toLocaleString('en-IN')} more for Complimentary Delivery`
                        : 'Unlocked: Complimentary Royal Delivery!'}
                    </span>
                  </span>
                  <span className="text-[11px] font-extrabold text-[#128F92] uppercase tracking-wider shrink-0 ml-2">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full bg-[#DDF3F2] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#128F92] h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Scrolling Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 space-y-4 sm:space-y-5">
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
                  className="relative bg-white rounded-[24px] p-4 sm:p-5 border border-[#D4E5E3] shadow-card hover:shadow-hover transition-all duration-300 flex gap-4 sm:gap-5"
                >
                  {/* Top-Right Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full text-[#687F8D] hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                    aria-label={`Remove ${item.product.name} from bag`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Product Thumbnail (88-104px square) */}
                  <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-[20px] overflow-hidden bg-[#F0F9F8] shrink-0 border border-[#DDF3F2] flex items-center justify-center p-2 shadow-xs">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      sizes="104px"
                      className="object-contain p-1"
                    />
                  </div>

                  {/* Product Information */}
                  <div className="flex-1 min-w-0 pr-6 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#128F92] font-extrabold mb-0.5">
                        {item.product.brand}
                      </p>
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={() => setIsCartOpen(false)}
                        className="text-sm sm:text-base font-bold text-[#0B4145] hover:text-[#128F92] line-clamp-2 leading-snug transition-colors"
                      >
                        {item.product.name}
                      </Link>

                      {/* Variant Details on separate readable line */}
                      {(item.selectedShade || item.selectedSize) && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {item.selectedShade && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0F9F8] border border-[#DDF3F2] text-[11px] font-semibold text-[#0B4145]">
                              <span className="text-[#687F8D]">Shade:</span>
                              <strong>{item.selectedShade}</strong>
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0F9F8] border border-[#DDF3F2] text-[11px] font-semibold text-[#0B4145]">
                              <span className="text-[#687F8D]">Size:</span>
                              <strong>{item.selectedSize}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity Selector & Price arranged cleanly below */}
                    <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-[#DDF3F2]/70">
                      {/* Rounded Quantity Selector */}
                      <div className="flex items-center border border-[#D4E5E3] rounded-full bg-[#F0F9F8] p-1 shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] hover:text-[#128F92] flex items-center justify-center transition-colors shadow-xs"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.4]" />
                        </button>
                        <span className="min-w-[28px] text-center text-xs font-extrabold text-[#0B4145]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] hover:text-[#128F92] flex items-center justify-center transition-colors shadow-xs"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
                        </button>
                      </div>

                      {/* Prominent Price */}
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-extrabold text-[#0B4145] block leading-none">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-[#687F8D] font-medium block mt-0.5">
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

          {/* 4. Fixed Bottom Order Summary & Checkout */}
          {cart.length > 0 && (
            <div className="p-6 sm:p-8 bg-white border-t border-[#D4E5E3] shadow-[0_-10px_35px_rgba(11,65,69,0.08)] space-y-4 shrink-0">
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
                    ₹{(subtotal + (remainingForFreeShipping === 0 ? 0 : 150)).toLocaleString('en-IN')}
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

        </div>
      </div>
    </div>
  );
}
