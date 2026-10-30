'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  Heart,
  Share2,
} from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import ProductGrid from '@/components/product/ProductGrid';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedShade, setSelectedShade] = useState(
    product.shades && product.shades.length > 0 ? product.shades[0].name : undefined
  );
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 0 ? product.sizes[0].size : undefined
  );
  const [activeTab, setActiveTab] = useState<'details' | 'usage' | 'ingredients'>('details');
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedShade, selectedSize);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedShade, selectedSize);
    setIsCartOpen(true);
  };

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-9 space-y-10 sm:space-y-12">
      {/* Breadcrumbs in clean floating card pill */}
      <nav className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#687F8D] font-bold tracking-wide bg-white px-4 py-2 rounded-full border border-[#D4E5E3] shadow-soft">
        <Link href="/" className="hover:text-[#128F92] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#BCE7E5]" />
        <Link href="/collections" className="hover:text-[#128F92] transition-colors">
          Collections
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#BCE7E5]" />
        <Link
          href={`/collections/${product.categorySlug}`}
          className="hover:text-[#128F92] transition-colors"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#BCE7E5]" />
        <span className="text-[#0B4145] font-extrabold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase: Both Sides as Distinct Elevated White Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left: Gallery Column Card */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-4.5 sm:p-6 border border-[#D4E5E3] shadow-card flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:w-20 shrink-0 py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#F0F9F8] border-2 transition-all shrink-0 p-1.5 flex items-center justify-center ${
                    selectedImageIndex === idx
                      ? 'border-[#128F92] ring-2 ring-[#128F92]/20 shadow-sm'
                      : 'border-[#DDF3F2] hover:border-[#128F92]/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Large Image: High Clarity, Uncropped with Natural Dimensions */}
          <div className="relative flex-1 aspect-[4/5] rounded-[20px] overflow-hidden bg-[#F0F9F8] border border-[#DDF3F2] p-4 sm:p-7 flex items-center justify-center">
            <Image
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-contain object-center transition-all duration-300 p-3 sm:p-5"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.isBestseller && (
                <span className="bg-[#0B4145] text-white text-[11px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm">
                  Bestseller
                </span>
              )}
              {discountPercent > 0 && (
                <span className="bg-[#DDF3F2] text-[#0B4145] text-[11px] font-bold px-3 py-0.5 rounded-full border border-[#BCE7E5] shadow-sm">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Actions (Wishlist & Share) */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`p-2.5 rounded-full backdrop-blur-md transition-colors shadow-soft ${
                  isWishlisted
                    ? 'bg-[#128F92] text-white'
                    : 'bg-white/90 hover:bg-white text-[#0B4145]'
                }`}
                aria-label="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Product link copied to clipboard!');
                  }
                }}
                className="p-2.5 rounded-full bg-white/90 hover:bg-white text-[#0B4145] backdrop-blur-md transition-colors shadow-soft"
                aria-label="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Product Details Card */}
        <div className="lg:col-span-5 bg-white rounded-[24px] sm:rounded-[26px] p-5 sm:p-7 lg:p-8 border border-[#D4E5E3] shadow-card flex flex-col justify-between space-y-5">
          <div className="space-y-5">
            {/* Brand & Category */}
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold text-[#128F92]">
              <Link href={`/brands/${product.brandSlug}`} className="hover:underline">
                {product.brand}
              </Link>
              <span>&bull;</span>
              <span>{product.category}</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B4145] leading-tight">
              {product.name}
            </h1>

            {/* Reviews & Availability */}
            <div className="flex items-center gap-4 text-sm pb-1">
              <div className="flex items-center gap-1.5 font-bold text-[#0B4145]">
                <div className="flex text-[#128F92]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating) ? 'fill-current' : 'opacity-30'
                      }`}
                    />
                  ))}
                </div>
                <span>{product.rating}</span>
                <span className="text-[#687F8D] font-medium">
                  ({product.reviewCount} reviews)
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-bold">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    product.isAvailable ? 'bg-[#128F92]' : 'bg-red-500'
                  }`}
                />
                <span className={product.isAvailable ? 'text-[#0B4145]' : 'text-red-600'}>
                  {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0B4145]">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg sm:text-xl text-[#687F8D] line-through font-medium">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-xs text-[#687F8D] font-bold">
                (Inclusive of all taxes)
              </span>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#687F8D] leading-relaxed font-medium">
              {product.description}
            </p>

            {/* Shades Selector */}
            {product.shades && product.shades.length > 0 && (
              <div className="pt-3.5 border-t border-[#DDF3F2]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-[#0B4145]">
                    Shade:
                  </span>
                  <span className="text-sm text-[#0B4145] font-bold">
                    {selectedShade || 'Select shade'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.shades.map((shade) => (
                    <button
                      key={shade.id}
                      type="button"
                      onClick={() => setSelectedShade(shade.name)}
                      className={`group relative p-1 rounded-full border-2 transition-all ${
                        selectedShade === shade.name
                          ? 'border-[#128F92] ring-2 ring-[#128F92]/30 scale-105'
                          : 'border-transparent hover:border-[#DDF3F2]'
                      }`}
                    >
                      <span
                        className="block w-5.5 h-5.5 rounded-full border border-black/10 shadow-inner"
                        style={{ backgroundColor: shade.hex }}
                      />
                      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0B4145] text-white text-[10px] py-0.5 px-2 rounded whitespace-nowrap z-20 pointer-events-none font-bold">
                        {shade.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="pt-3.5 border-t border-[#DDF3F2]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-[#0B4145]">
                    Size:
                  </span>
                  <span className="text-sm text-[#0B4145] font-bold">{selectedSize}</span>
                </div>
                <div className="flex gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSize(s.size)}
                      className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all ${
                        selectedSize === s.size
                          ? 'bg-[#128F92] text-white border-[#128F92] shadow-cta'
                          : 'bg-white text-[#0B4145] border-[#DDF3F2] hover:border-[#128F92]'
                      }`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            <div className="pt-5 border-t border-[#DDF3F2] space-y-3">
              <div className="flex items-center gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-[#DDF3F2] rounded-full bg-white px-3 py-1.5 shadow-soft">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 text-[#0B4145] hover:text-[#128F92] flex items-center justify-center text-base font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className="w-7 text-center text-sm sm:text-base font-bold text-[#0B4145]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 text-[#0B4145] hover:text-[#128F92] flex items-center justify-center text-base font-bold transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Primary Teal Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!product.isAvailable}
                  className="flex-1 h-[48px] sm:h-[50px] px-6 sm:px-7 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-cta flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
              </div>

              {/* Secondary Pill Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.isAvailable}
                className="w-full h-[48px] sm:h-[50px] px-6 sm:px-7 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] border border-[#DDF3F2] text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-card disabled:opacity-50"
              >
                Instant Checkout
              </button>
            </div>

            {/* Service & Delivery Assurance */}
            <div className="pt-5 border-t border-[#DDF3F2] grid grid-cols-3 gap-2.5 text-center text-[11px] sm:text-xs text-[#0B4145] font-bold">
              <div className="flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl bg-[#F0F9F8] border border-[#DDF3F2]">
                <Truck className="w-4.5 h-4.5 text-[#128F92]" />
                <span>Complimentary Delivery &gt; ₹1,999</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl bg-[#F0F9F8] border border-[#DDF3F2]">
                <ShieldCheck className="w-4.5 h-4.5 text-[#128F92]" />
                <span>100% Genuine Formula</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl bg-[#F0F9F8] border border-[#DDF3F2]">
                <RotateCcw className="w-4.5 h-4.5 text-[#128F92]" />
                <span>7-Day Return Policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pt-6 sm:pt-7 border-t border-[#DDF3F2]">
        <div className="flex border-b border-[#DDF3F2] gap-6 sm:gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-3 sm:pb-3.5 text-sm sm:text-base font-bold transition-colors ${
              activeTab === 'details'
                ? 'text-[#128F92] border-b-2 border-[#128F92]'
                : 'text-[#687F8D] hover:text-[#0B4145]'
            }`}
          >
            Product Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('usage')}
            className={`pb-3 sm:pb-3.5 text-sm sm:text-base font-bold transition-colors ${
              activeTab === 'usage'
                ? 'text-[#128F92] border-b-2 border-[#128F92]'
                : 'text-[#687F8D] hover:text-[#0B4145]'
            }`}
          >
            Application Ritual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ingredients')}
            className={`pb-3 sm:pb-3.5 text-sm sm:text-base font-bold transition-colors ${
              activeTab === 'ingredients'
                ? 'text-[#128F92] border-b-2 border-[#128F92]'
                : 'text-[#687F8D] hover:text-[#0B4145]'
            }`}
          >
            Botanical Actives
          </button>
        </div>

        <div className="py-6 sm:py-7 bg-white rounded-[22px] sm:rounded-[24px] p-5 sm:p-7 lg:p-8 border border-[#D4E5E3] shadow-card mt-5">
          {activeTab === 'details' && (
            <div className="space-y-4 max-w-3xl">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0B4145]">
                About {product.name}
              </h3>
              <p className="text-sm sm:text-base text-[#687F8D] leading-relaxed font-medium">
                {product.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                <div className="p-3.5 rounded-xl bg-[#F0F9F8] border border-[#DDF3F2]">
                  <span className="text-[11px] uppercase font-extrabold text-[#128F92] block">
                    Finish / Texture
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#0B4145]">
                    Velvet Matte / Weightless
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F0F9F8] border border-[#DDF3F2]">
                  <span className="text-[11px] uppercase font-extrabold text-[#128F92] block">
                    Coverage
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#0B4145]">
                    Buildable Full Pigment
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F0F9F8] border border-[#DDF3F2]">
                  <span className="text-[11px] uppercase font-extrabold text-[#128F92] block">
                    Formulation
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#0B4145]">
                    100% Vegan &amp; Clean
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-4 max-w-3xl">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0B4145]">
                How to Apply
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base text-[#687F8D] font-medium leading-relaxed">
                <li>Begin by preparing clean, exfoliated skin or lips.</li>
                <li>Dispense 1-2 pumps or glide the teardrop applicator gently over the center.</li>
                <li>Blend outward toward the contours using fingertips or our artisan brush.</li>
                <li>Allow 60 seconds to set into a weightless, long-wearing veil.</li>
              </ol>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-4 max-w-3xl">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0B4145]">
                Ingredients &amp; Bio-Actives
              </h3>
              <p className="text-sm text-[#687F8D] leading-relaxed font-medium">
                Cold-Pressed Camellia Seed Oil, Plant-Derived Squalane, Gotu Kola Extract, Kashmiri Saffron Pistils, Vitamin E Tocopherol, Jojoba Esters, Mineral Mica, Silica Silylate, Fragrance (Natural Rose Damascena).
              </p>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 font-bold">
                ✓ Free from parabens, phthalates, synthetic sulfites, gluten, and animal derivatives.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Formulations */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-6 sm:pt-7 border-t border-[#DDF3F2]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#128F92] font-extrabold block mb-1">
                Complementary Rituals
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B4145]">
                You May Also Admire
              </h2>
            </div>
            <Link
              href="/collections"
              className="mt-3 sm:mt-0 text-xs sm:text-sm font-bold text-[#128F92] hover:text-[#0B4145] uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <ProductGrid products={relatedProducts.slice(0, 4)} columns="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4" />
        </div>
      )}
    </div>
  );
}