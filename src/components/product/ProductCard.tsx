'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingBag, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedShadeHex, setSelectedShadeHex] = useState(
    product.shades && product.shades.length > 0 ? product.shades[0].hex : undefined
  );
  const [selectedShadeName, setSelectedShadeName] = useState(
    product.shades && product.shades.length > 0 ? product.shades[0].name : undefined
  );

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    addToCart(product, 1, selectedShadeName, product.sizes ? product.sizes[0]?.size : undefined);
    setTimeout(() => {
      setIsAdding(false);
    }, 1200);
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-[16px] sm:rounded-[20px] md:rounded-[22px] p-2.5 sm:p-3.5 md:p-4 shadow-card hover:shadow-hover border border-[#D4E5E3] hover:border-[#128F92]/40 transition-all duration-300 h-full">
      {/* 1. Large Product Image: Completely Unobstructed, Natural Aspect Ratio */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-[12px] sm:rounded-[14px] md:rounded-[16px] bg-[#F0F9F8] p-1.5 sm:p-2.5 md:p-3 shrink-0"
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1440px) 25vw, 20vw"
          className="object-contain object-center group-hover:scale-105 transition-transform duration-500 ease-out p-0.5 sm:p-1"
        />

        {/* Minimal Rounded Badge (Bestseller / New) */}
        {product.isBestseller ? (
          <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10">
            <span className="bg-[#0B4145] text-white text-[9px] sm:text-[10px] md:text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 sm:px-2.5 sm:py-0.5 md:px-3 md:py-1 rounded-full shadow-sm">
              Bestseller
            </span>
          </div>
        ) : product.isNew ? (
          <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10">
            <span className="bg-[#DDF3F2] text-[#0B4145] text-[9px] sm:text-[10px] md:text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 sm:px-2.5 sm:py-0.5 md:px-3 md:py-1 rounded-full border border-[#BCE7E5] shadow-sm">
              New
            </span>
          </div>
        ) : null}
      </Link>

      {/* Card Body with Flexible Spacing */}
      <div className="pt-2 sm:pt-3 flex-1 flex flex-col justify-between">
        <div>
          {/* 2. Brand name and rating */}
          <div className="flex items-center justify-between mb-1 sm:mb-1.5 gap-1">
            <Link
              href={`/brands/${product.brandSlug}`}
              className="text-[10px] sm:text-[11px] md:text-xs uppercase tracking-wider font-extrabold text-[#128F92] hover:text-[#0B4145] transition-colors truncate max-w-[65%]"
            >
              {product.brand}
            </Link>

            <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] md:text-xs text-[#0B4145] font-bold bg-[#DDF3F2]/60 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3.5 fill-[#128F92] text-[#128F92]" />
              <span>{product.rating}</span>
            </div>
          </div>

          {/* 3. Product name without awkward truncation */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-serif text-xs sm:text-[14px] md:text-[16px] font-bold text-[#0B4145] line-clamp-2 min-h-[2rem] sm:min-h-[2.3rem] md:min-h-[2.5rem] group-hover:text-[#128F92] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* 4. Variant or color selection, when available */}
          {product.shades && product.shades.length > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
              {product.shades.slice(0, 5).map((shade) => (
                <button
                  key={shade.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedShadeHex(shade.hex);
                    setSelectedShadeName(shade.name);
                  }}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded-full border transition-all ${
                    selectedShadeHex === shade.hex
                      ? 'ring-2 ring-[#128F92] ring-offset-1 scale-110'
                      : 'border-[#BCE7E5]'
                  }`}
                  style={{ backgroundColor: shade.hex }}
                  title={shade.name}
                  aria-label={shade.name}
                />
              ))}
              {product.shades.length > 5 && (
                <span className="text-[9px] sm:text-[10px] md:text-[11px] text-[#687F8D] font-bold ml-0.5">
                  +{product.shades.length - 5}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section: Price & Rounded Add to Bag Button */}
        <div className="pt-2 sm:pt-2.5 mt-2 sm:mt-2.5 border-t border-[#DDF3F2]/70 space-y-2 sm:space-y-2.5">
          {/* 5. Current price and original price */}
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-extrabold text-sm sm:text-base md:text-lg text-[#0B4145]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] sm:text-[11px] md:text-xs text-[#687F8D] line-through font-medium">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* 6. Rounded “Add to Bag” button within normal content flow */}
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!product.isAvailable || isAdding}
            className="w-full h-[32px] sm:h-[36px] md:h-[40px] rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-[10px] sm:text-[11px] md:text-xs uppercase tracking-normal sm:tracking-wider font-bold transition-all shadow-cta flex items-center justify-center gap-1 sm:gap-1.5 disabled:opacity-50"
          >
            {isAdding ? (
              <>
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                <span>Added to Bag</span>
              </>
            ) : product.isAvailable ? (
              <>
                <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Add to Bag</span>
              </>
            ) : (
              <span>Out of Stock</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}