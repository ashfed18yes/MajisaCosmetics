'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/collections/${category.slug}`}
      className="group relative flex flex-col rounded-[16px] sm:rounded-[20px] md:rounded-[22px] overflow-hidden bg-white p-2.5 sm:p-3.5 md:p-4 shadow-card hover:shadow-hover border border-[#D4E5E3] hover:border-[#128F92]/40 transition-all duration-300"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[12px] sm:rounded-[16px] md:rounded-[18px] bg-[#F0F9F8]">
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B4145]/90 via-[#0B4145]/30 to-transparent" />

        <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 text-white">
          <span className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-wider font-bold text-[#DDF3F2] block mb-0.5 sm:mb-1">
            Collection
          </span>
          <h3 className="font-serif text-sm sm:text-base md:text-xl font-bold tracking-wide leading-tight line-clamp-1">
            {category.name}
          </h3>
          <p className="text-[10px] sm:text-xs text-[#DDF3F2]/90 line-clamp-1 font-medium mt-0.5 sm:mt-1">
            {category.tagline}
          </p>
          <div className="mt-2 sm:mt-3 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-[10px] sm:text-xs group-hover:bg-[#128F92] transition-colors">
            <span>Explore</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}