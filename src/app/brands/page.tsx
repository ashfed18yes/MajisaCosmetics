'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Sparkles, ArrowRight } from 'lucide-react';
import { BRANDS } from '@/data/mockData';
import BrandCard from '@/components/brand/BrandCard';

export default function BrandsDirectoryPage() {
  const [search, setSearch] = useState('');

  const filteredBrands = useMemo(() => {
    if (!search.trim()) return BRANDS;
    const q = search.toLowerCase();
    return BRANDS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        (b.origin && b.origin.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-16 space-y-12 sm:space-y-14">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#DDF3F2] text-[#128F92] border border-[#128F92]/20 text-xs uppercase tracking-wider font-extrabold mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#128F92]" />
          <span>Atelier Directory</span>
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#0B4145] font-bold tracking-tight">
          The Houses of Majisa
        </h1>
        <p className="mt-3.5 text-base sm:text-lg text-[#687F8D] font-medium leading-relaxed">
          From royal palace botanical laboratories of Jaipur to clean biotechnology ateliers of Geneva and Paris—discover the premier beauty houses we curate.
        </p>

        {/* Brand Search Bar Card */}
        <div className="mt-8 relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-[#128F92] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search houses by name or origin..."
            className="w-full pl-11 pr-10 py-3.5 bg-white border border-[#D4E5E3] rounded-full text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] focus:ring-2 focus:ring-[#128F92]/20 shadow-card transition-all font-semibold"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#687F8D] hover:text-[#0B4145]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Brands Grid - Distinct White Cards */}
      {filteredBrands.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[32px] border border-[#DDF3F2] max-w-md mx-auto shadow-card p-8">
          <p className="font-serif text-2xl text-[#0B4145] font-bold mb-2">
            No brand found matching &ldquo;{search}&rdquo;
          </p>
          <p className="text-sm text-[#687F8D] mb-6">
            Try checking the spelling or browse our full collection directory.
          </p>
          <button
            onClick={() => setSearch('')}
            className="px-8 py-3 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs font-bold uppercase tracking-wider shadow-cta transition-all"
          >
            Show All Brands
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8">
          {filteredBrands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}

      {/* Brand Partnership Note as an Elevated White Card */}
      <div className="bg-white rounded-[32px] p-8 sm:p-12 border border-[#DDF3F2] text-center max-w-3xl mx-auto shadow-card">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[#DDF3F2] text-[#128F92] text-xs font-extrabold uppercase tracking-wider mb-3">
          Partnership Atelier
        </span>
        <h3 className="font-serif text-2xl sm:text-3xl text-[#0B4145] font-bold mb-3">
          Seeking Representation with Majisa?
        </h3>
        <p className="text-sm sm:text-base text-[#687F8D] leading-relaxed max-w-xl mx-auto mb-6 font-medium">
          Majisa Cosmetics collaborates with select artisanal and clean beauty houses dedicated to uncompromising purity and cruelty-free luxury standards.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 h-[52px] px-8 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold shadow-cta transition-all"
        >
          <span>Contact Brand Relations</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}