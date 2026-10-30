'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/types';
import { Sparkles, RotateCcw } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onResetFilters?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  columns?: string;
}

export default function ProductGrid({
  products,
  isLoading = false,
  onResetFilters,
  emptyTitle = 'No Formulations Found',
  emptyDescription = 'We could not find any products matching your selected criteria. Try adjusting or clearing your filters.',
  columns = 'grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4',
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className={`grid ${columns} gap-4 sm:gap-5 lg:gap-6`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-[20px] sm:rounded-[22px] p-3.5 sm:p-4 border border-[#D4E5E3] shadow-card space-y-3.5"
          >
            <div className="aspect-[4/5] bg-[#F0F9F8] rounded-[16px]" />
            <div className="h-3.5 bg-[#DDF3F2] rounded-full w-1/3" />
            <div className="h-4.5 bg-[#DDF3F2] rounded-full w-4/5" />
            <div className="h-5 bg-[#DDF3F2] rounded-full w-1/4" />
            <div className="h-10 bg-[#DDF3F2] rounded-full w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 px-8 text-center bg-white rounded-[32px] border border-[#D4E5E3] shadow-card max-w-xl mx-auto my-10">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#DDF3F2] flex items-center justify-center text-[#128F92] shadow-soft">
          <Sparkles className="w-8 h-8 stroke-[1.8]" />
        </div>
        <h3 className="font-serif text-3xl font-bold text-[#0B4145] mb-2">
          {emptyTitle}
        </h3>
        <p className="text-base text-[#687F8D] mb-8 leading-relaxed font-medium">
          {emptyDescription}
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2.5 h-[52px] px-8 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-cta"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`grid ${columns} gap-4 sm:gap-5 lg:gap-6`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}