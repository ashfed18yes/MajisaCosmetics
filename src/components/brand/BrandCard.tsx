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
      className="group relative flex flex-col bg-white rounded-[32px] overflow-hidden p-5 sm:p-6 shadow-card hover:shadow-hover border border-[#D4E5E3] hover:border-[#128F92]/40 transition-all duration-300"
    >
      {/* Banner Image */}
      <div className="relative h-56 sm:h-64 w-full overflow-hidden rounded-[24px] bg-[#F0F9F8]">
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
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-[#0B4145] shadow-sm flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#128F92]" />
            <span>{brand.origin}</span>
          </div>
        )}

        {/* Brand Title in banner */}
        <div className="absolute bottom-5 left-5 right-5">
          <h3 className="font-serif text-2xl sm:text-3xl text-white font-bold drop-shadow">
            {brand.name}
          </h3>
          <p className="text-xs sm:text-sm text-[#DDF3F2] line-clamp-1 font-medium mt-1">
            {brand.tagline}
          </p>
        </div>
      </div>

      {/* Brand Description & Link */}
      <div className="pt-5 flex-1 flex flex-col justify-between">
        <p className="text-sm sm:text-base text-[#687F8D] line-clamp-2 leading-relaxed mb-5 font-medium">
          {brand.description}
        </p>

        <div className="pt-4 border-t border-[#DDF3F2] flex items-center justify-between text-xs sm:text-sm font-bold text-[#128F92] group-hover:text-[#0B4145] transition-colors">
          <span className="uppercase tracking-wider">Discover Brand</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}