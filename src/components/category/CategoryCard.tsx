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
      className="group relative flex flex-col rounded-[32px] overflow-hidden bg-white p-4 sm:p-5 shadow-card hover:shadow-hover border border-[#D4E5E3] hover:border-[#128F92]/40 transition-all duration-300"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[24px] bg-[#F0F9F8]">
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B4145]/90 via-[#0B4145]/30 to-transparent" />

        <div className="absolute bottom-5 left-5 right-5 text-white">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#DDF3F2] block mb-1">
            Collection
          </span>
          <h3 className="font-serif text-2xl font-bold tracking-wide leading-tight">
            {category.name}
          </h3>
          <p className="text-xs sm:text-sm text-[#DDF3F2]/90 line-clamp-1 font-medium mt-1">
            {category.tagline}
          </p>
          <div className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-xs group-hover:bg-[#128F92] transition-colors">
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}