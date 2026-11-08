'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Sparkles, ArrowRight } from 'lucide-react';
import { Brand } from '@/types';
import BrandCard from '@/components/brand/BrandCard';

interface BrandsDirectoryClientProps {
  initialBrands: Brand[];
}

export default function BrandsDirectoryClient({ initialBrands }: BrandsDirectoryClientProps) {
  const [search, setSearch] = useState('');

  const filteredBrands = useMemo(() => {
    if (!search.trim()) return initialBrands;
    const q = search.toLowerCase();
    return initialBrands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        (b.origin && b.origin.toLowerCase().includes(q))
    );
  }, [search, initialBrands]);

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DDF3F2] text-[#128F92] border border-[#128F92]/20 text-[10px] sm:text-xs uppercase tracking-wider font-extrabold mb-2 shadow-xs">
          <Sparkles className="w-3 h-3 text-[#128F92]" />
          <span>Atelier Directory</span>
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#0B4145] font-bold tracking-tight">
          The Houses of Majisa
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-[#687F8D] font-medium leading-relaxed">
          From royal palace botanical laboratories of Jaipur to clean biotechnology ateliers of Geneva and Paris—discover the premier beauty houses we curate.
        </p>

        {/* Brand Search Bar Card */}
        <div className="mt-4 relative max-w-md mx-auto">
          <Search className="w-3.5 h-3.5 text-[#128F92] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search houses by name or origin..."
            className="w-full pl-9 pr-9 py-2 bg-white border border-[#D4E5E3] rounded-full text-xs sm:text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] focus:ring-1.5 focus:ring-[#128F92]/20 shadow-xs transition-all font-semibold"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#687F8D] hover:text-[#0B4145]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Brands Grid - Distinct White Cards */}
      {filteredBrands.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl border border-[#DDF3F2] max-w-md mx-auto shadow-xs p-5 sm:p-6">
          <p className="font-serif text-lg sm:text-xl text-[#0B4145] font-bold mb-1">
            No brand found matching &ldquo;{search}&rdquo;
          </p>
          <p className="text-xs text-[#687F8D] mb-4">
            Try checking the spelling or browse our full collection directory.
          </p>
          <button
            onClick={() => setSearch('')}
            className="px-5 py-2 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs font-bold uppercase tracking-wider shadow-cta transition-all"
          >
            Show All Brands
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5">
          {filteredBrands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}

      {/* Brand Partnership Note as an Elevated White Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDF3F2] text-center max-w-2xl mx-auto shadow-xs">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#DDF3F2] text-[#128F92] text-[10px] font-extrabold uppercase tracking-wider mb-2">
          Partnership Atelier
        </span>
        <h3 className="font-serif text-lg sm:text-xl text-[#0B4145] font-bold mb-1.5">
          Seeking Representation with Majisa?
        </h3>
        <p className="text-xs text-[#687F8D] leading-relaxed max-w-lg mx-auto mb-4 font-medium">
          Majisa Cosmetics collaborates with select artisanal and clean beauty houses dedicated to uncompromising purity and cruelty-free luxury standards.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 h-10 px-6 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase tracking-wider font-bold shadow-cta transition-all"
        >
          <span>Contact Brand Relations</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

