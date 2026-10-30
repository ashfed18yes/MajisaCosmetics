'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Brand } from '@/types';
import { ArrowRight, MapPin } from 'lucide-react';

interface BrandCardProps {
  brand: Brand;
}

export default function BrandCard({ brand }: BrandCardProps) {
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className="group relative flex flex-col bg-white rounded-[22px] overflow-hidden p-3.5 sm:p-4.5 shadow-card hover:shadow-hover border border-[#D4E5E3] hover:border-[#128F92]/40 transition-all duration-300"
    >
      {/* Banner Image */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden rounded-[18px] bg-[#F0F9F8]">
        <Image
          src={brand.banner}
          alt={brand.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B4145]/90 via-[#0B4145]/35 to-transparent" />

        {/* Origin Badge */}
        {brand.origin && (
          <div className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-[#0B4145] shadow-sm flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#128F92]" />
            <span>{brand.origin}</span>
          </div>
        )}

        {/* Brand Title in banner */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-serif text-xl sm:text-2xl text-white font-bold drop-shadow">
            {brand.name}
          </h3>
          <p className="text-xs text-[#DDF3F2] line-clamp-1 font-medium mt-0.5">
            {brand.tagline}
          </p>
        </div>
      </div>

      {/* Brand Description & Link */}
      <div className="pt-3.5 flex-1 flex flex-col justify-between">
        <p className="text-xs sm:text-sm text-[#687F8D] line-clamp-2 leading-relaxed mb-3.5 font-medium">
          {brand.description}
        </p>

        <div className="pt-3 border-t border-[#DDF3F2] flex items-center justify-between text-xs sm:text-sm font-bold text-[#128F92] group-hover:text-[#0B4145] transition-colors">
          <span className="uppercase tracking-wider">Discover Brand</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}