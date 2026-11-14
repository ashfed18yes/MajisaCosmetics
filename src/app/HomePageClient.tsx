'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Sparkles, Award, Star, MessageCircle } from 'lucide-react';
import { Product, Category, Brand } from '@/types';
import { CONTACT_INFO } from '@/config/contact';
import ProductCard from '@/components/product/ProductCard';
import CategoryCard from '@/components/category/CategoryCard';
import BrandCard from '@/components/brand/BrandCard';

interface HomePageClientProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
}

export default function HomePageClient({
  products,
  categories,
  brands,
}: HomePageClientProps) {
  const [activeTab, setActiveTab] = useState<'bestsellers' | 'new'>('bestsellers');

  const bestsellers = products.filter((p) => p.isBestseller);
  const newArrivals = products.filter((p) => p.isNew);

  // If none explicitly tagged as bestseller/new yet, ensure live products are prominently displayed
  const displayedBestsellers = bestsellers.length > 0 ? bestsellers : products;
  const displayedNewArrivals = newArrivals.length > 0 ? newArrivals : products;
  const displayedProducts = activeTab === 'bestsellers' ? displayedBestsellers : displayedNewArrivals;

  return (
    <div className="space-y-8 sm:space-y-10 lg:space-y-12 pb-10 sm:pb-14">
      {/* 1. Hero Section matching the Reference Aesthetic */}
      <section className="pt-2 sm:pt-4 pb-2 sm:pb-4">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left">
              {/* Reference-Style Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D4E5E3] shadow-soft text-[#0B4145] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#128F92]" />
                <span>Premier Botanical Formulations &bull; Clean Luxury Beauty</span>
              </div>

              {/* Dominant Calibrated Headline */}
              <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl text-[#0B4145] leading-[1.1] font-bold tracking-tight">
                Restoring Radiance. <br />
                <span className="italic font-normal text-[#128F92]">Elevating Beauty.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-xs sm:text-sm lg:text-base text-[#687F8D] leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                Experience royal heritage botanicals perfected through advanced cosmetic science. Discover opulent pigments, cellular serums, and weightless velvet textures.
              </p>

              {/* Calibrated Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 pt-0.5">
                <Link
                  href="/collections"
                  className="w-full sm:w-auto h-10 sm:h-11 px-5 sm:px-6 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase tracking-wider font-bold transition-all shadow-cta flex items-center justify-center gap-1.5 group hover:scale-102"
                >
                  <span>Shop Collections</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/brands"
                  className="w-full sm:w-auto h-10 sm:h-11 px-5 sm:px-6 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] border border-[#D4E5E3] text-xs uppercase tracking-wider font-bold transition-all shadow-xs flex items-center justify-center hover:scale-102"
                >
                  <span>Explore Brands</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-2.5 text-xs text-[#0B4145] font-bold">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#D4E5E3] shadow-soft">
                  <div className="flex text-[#128F92]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <span>4.9 / 5 Rating</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#D4E5E3] shadow-soft">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#128F92]" />
                  <span>Dermatologist Tested</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#D4E5E3] shadow-soft">
                  <Award className="w-3.5 h-3.5 text-[#128F92]" />
                  <span>100% Cruelty-Free</span>
                </div>
              </div>
            </div>

            {/* Right Editorial Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] w-full max-w-sm xl:max-w-md mx-auto rounded-2xl overflow-hidden shadow-[0_10px_28px_rgba(11,65,69,0.08)] border-3 border-white bg-white">
                <Image
                  src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop"
                  alt="Majisa Cosmetics Beauty Showcase"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category */}
      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-5 pb-2.5 sm:pb-3 border-b border-[#DDF3F2]">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#128F92] font-extrabold block mb-0.5">
              Curated Avenues
            </span>
            <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl text-[#0B4145] font-bold">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/collections"
            className="mt-2 sm:mt-0 text-xs font-bold text-[#128F92] hover:text-[#0B4145] tracking-wider uppercase inline-flex items-center gap-1.5 transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
          {categories.slice(0, 6).map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* 3. Bestsellers & Featured Products */}
      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-5 pb-2.5 sm:pb-3 border-b border-[#DDF3F2] gap-2.5 sm:gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#128F92] font-extrabold block mb-0.5">
              Most Loved Formulations
            </span>
            <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl text-[#0B4145] font-bold">
              Featured Formulations
            </h2>
          </div>

          {/* Prominent Calibrated Pill Tab Control */}
          <div className="flex items-center p-0.5 bg-white rounded-full border border-[#D4E5E3] shadow-soft">
            <button
              type="button"
              onClick={() => setActiveTab('bestsellers')}
              className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'bestsellers'
                  ? 'bg-[#128F92] text-white shadow-cta'
                  : 'text-[#687F8D] hover:text-[#0B4145]'
                }`}
            >
              Bestsellers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'new'
                  ? 'bg-[#128F92] text-white shadow-cta'
                  : 'text-[#687F8D] hover:text-[#0B4145]'
                }`}
            >
              New Arrivals
            </button>
          </div>
        </div>

        {/* Calibrated Product Cards or Clean Empty State */}
        {displayedProducts.length === 0 ? (
          <div className="text-center py-10 px-5 bg-white rounded-xl border border-[#D4E5E3] shadow-xs max-w-md mx-auto">
            <Sparkles className="w-7 h-7 text-[#128F92] mx-auto mb-2" />
            <h3 className="font-serif text-xl font-bold text-[#0B4145] mb-1.5">
              New Formulations Arriving Soon
            </h3>
            <p className="text-xs text-[#687F8D] font-medium mb-4">
              Our master ateliers are currently formulating and preparing our upcoming batches.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#128F92] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0B4145] transition-colors shadow-cta"
            >
              <span>Explore Collections</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
              {displayedProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="text-center mt-6 sm:mt-8">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] border border-[#D4E5E3] text-xs uppercase tracking-wider font-bold transition-all shadow-xs hover:scale-102"
              >
                <span>Explore Entire Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* 4. Soft Aqua Feature: The Majisa Standard */}
      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="bg-[#DDF3F2]/55 rounded-2xl border border-[#BCE7E5] p-5 sm:p-7 lg:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Image */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-sm border-3 border-white max-w-xs mx-auto bg-white">
                <Image
                  src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&auto=format&fit=crop"
                  alt="Biocompatible Clean Skincare Formulations"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Right Copy */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-4">
              <span className="text-[11px] uppercase tracking-widest text-[#128F92] font-extrabold block">
                The Majisa Standard
              </span>

              <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl text-[#0B4145] font-bold leading-tight">
                Skin-First Purity, <br />
                <span className="italic font-normal text-[#128F92]">Cruelty-Free Luxury</span>
              </h2>

              <p className="text-xs sm:text-sm text-[#687F8D] leading-relaxed font-medium">
                We believe cosmetics should nourish your skin from within. Every Majisa formula is powered by biocompatible botanicals—cold-pressed seed oils, protective squalane, and skin-adaptive mineral pigments.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-0.5">
                <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-[#D4E5E3] shadow-xs">
                  <h4 className="font-serif text-sm sm:text-base font-bold text-[#0B4145] mb-0.5">
                    Heritage Botanicals
                  </h4>
                  <p className="text-xs text-[#687F8D] leading-relaxed font-medium">
                    Saffron, gotu kola, and rosehip harvested from ethical cooperative farms.
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-[#D4E5E3] shadow-xs">
                  <h4 className="font-serif text-sm sm:text-base font-bold text-[#0B4145] mb-0.5">
                    Clean Science
                  </h4>
                  <p className="text-xs text-[#687F8D] leading-relaxed font-medium">
                    Zero parabens, sulfates, or microplastics. Dermatologically tested for sensitive skin.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/collections"
                  className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-5 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase tracking-wider font-bold transition-all shadow-cta"
                >
                  <span>Discover Collections</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Shop by Brand */}
      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-5 pb-2.5 sm:pb-3 border-b border-[#DDF3F2]">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#128F92] font-extrabold block mb-0.5">
              Atelier Houses
            </span>
            <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl text-[#0B4145] font-bold">
              Available Brands
            </h2>
          </div>
          <Link
            href="/brands"
            className="mt-2 sm:mt-0 text-xs font-bold text-[#128F92] hover:text-[#0B4145] tracking-wider uppercase inline-flex items-center gap-1.5 transition-colors"
          >
            <span>View All Brands</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      </section>

      {/* 6. Concierge Assistance Touchpoint */}
      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#D4E5E3] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1 max-w-xl">
            <span className="text-[11px] uppercase tracking-widest text-[#128F92] font-extrabold block">
              Personalized Beauty Advisory
            </span>
            <h2 className="font-serif text-lg sm:text-xl text-[#0B4145] font-bold">
              Looking for Shade Guidance or Gifting Consultations?
            </h2>
            <p className="text-xs text-[#687F8D] font-medium leading-relaxed">
              Our dedicated beauty advisors are available to guide you to the perfect formulation for your tone and ritual.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            <Link
              href="/contact"
              className="h-9 sm:h-10 px-5 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase tracking-wider font-bold transition-all shadow-cta inline-flex items-center gap-1.5"
            >
              <span>Connect With Concierge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href={CONTACT_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 sm:h-10 px-4.5 rounded-full bg-[#DDF3F2] hover:bg-[#128F92] text-[#0B4145] hover:text-white border border-[#BCE7E5] text-xs uppercase tracking-wider font-bold transition-all inline-flex items-center gap-1.5"
              aria-label="Chat with Majisa Cosmetics on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#128F92] group-hover:text-white" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

