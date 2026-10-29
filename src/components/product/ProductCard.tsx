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
    <div className="group relative flex flex-col bg-white rounded-[26px] p-5 sm:p-5.5 shadow-card hover:shadow-hover border border-[#D4E5E3] hover:border-[#128F92]/40 transition-all duration-300 h-full">
      {/* 1. Large Product Image: Completely Unobstructed, Natural Aspect Ratio */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-[20px] bg-[#F0F9F8] p-3 sm:p-4 shrink-0"
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw"
          className="object-contain object-center group-hover:scale-105 transition-transform duration-500 ease-out p-2"
        />

        {/* Minimal Rounded Badge (Bestseller / New) */}
        {product.isBestseller ? (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-[#0B4145] text-white text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
              Bestseller
            </span>
          </div>
        ) : product.isNew ? (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-[#DDF3F2] text-[#0B4145] text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-[#BCE7E5] shadow-sm">
              New
            </span>
          </div>
        ) : null}
      </Link>

      {/* Card Body with Flexible Spacing */}
      <div className="pt-4 flex-1 flex flex-col justify-between">
        <div>
          {/* 2. Brand name and rating */}
          <div className="flex items-center justify-between mb-1.5">
            <Link
              href={`/brands/${product.brandSlug}`}
              className="text-xs uppercase tracking-wider font-extrabold text-[#128F92] hover:text-[#0B4145] transition-colors truncate max-w-[70%]"
            >
              {product.brand}
            </Link>

            <div className="flex items-center gap-1 text-xs text-[#0B4145] font-bold bg-[#DDF3F2]/60 px-2.5 py-0.5 rounded-full shrink-0">
              <Star className="w-3.5 h-3.5 fill-[#128F92] text-[#128F92]" />
              <span>{product.rating}</span>
            </div>
          </div>

          {/* 3. Product name without awkward truncation */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-serif text-lg font-bold text-[#0B4145] line-clamp-2 min-h-[2.8rem] group-hover:text-[#128F92] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* 4. Variant or color selection, when available */}
          {product.shades && product.shades.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {product.shades.slice(0, 5).map((shade) => (
                <button
                  key={shade.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedShadeHex(shade.hex);
                    setSelectedShadeName(shade.name);
                  }}
                  className={`w-4 h-4 rounded-full border transition-all ${
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
                <span className="text-[11px] text-[#687F8D] font-bold ml-0.5">
                  +{product.shades.length - 5}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section: Price & Rounded Add to Bag Button */}
        <div className="pt-3.5 mt-3 border-t border-[#DDF3F2]/70 space-y-3">
          {/* 5. Current price and original price */}
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-xl text-[#0B4145]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-[#687F8D] line-through font-medium">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* 6. Rounded “Add to Bag” button within normal content flow */}
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!product.isAvailable || isAdding}
            className="w-full h-11 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase tracking-wider font-bold transition-all shadow-cta flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAdding ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Added to Bag</span>
              </>
            ) : product.isAvailable ? (
              <>
                <ShoppingBag className="w-4 h-4" />
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