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
      className="group relative flex flex-col bg-white rounded-xl overflow-hidden p-3 sm:p-3.5 shadow-card hover:shadow-hover border border-[#D4E5E3] hover:border-[#128F92]/40 transition-all duration-300"
    >
      {/* Banner Image */}
      <div className="relative h-36 sm:h-40 w-full overflow-hidden rounded-lg bg-[#F0F9F8]">
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
          <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-[#0B4145] shadow-xs flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#128F92]" />
            <span>{brand.origin}</span>
          </div>
        )}

        {/* Brand Title in banner */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-serif text-lg sm:text-xl text-white font-bold drop-shadow">
            {brand.name}
          </h3>
          <p className="text-[11px] sm:text-xs text-[#DDF3F2] line-clamp-1 font-medium mt-0.5">
            {brand.tagline}
          </p>
        </div>
      </div>

      {/* Brand Description & Link */}
      <div className="pt-2.5 flex-1 flex flex-col justify-between">
        <p className="text-xs text-[#687F8D] line-clamp-2 leading-relaxed mb-2.5 font-medium">
          {brand.description}
        </p>

        <div className="pt-2.5 border-t border-[#DDF3F2] flex items-center justify-between text-xs font-bold text-[#128F92] group-hover:text-[#0B4145] transition-colors">
          <span className="uppercase tracking-wider">Discover Brand</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}