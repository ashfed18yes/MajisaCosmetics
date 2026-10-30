'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Sparkles, Award, Star, CheckCircle2, MessageCircle } from 'lucide-react';
import { CATEGORIES, BRANDS, getBestsellers, PRODUCTS } from '@/data/mockData';
import { CONTACT_INFO } from '@/config/contact';
import ProductCard from '@/components/product/ProductCard';
import CategoryCard from '@/components/category/CategoryCard';
import BrandCard from '@/components/brand/BrandCard';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'bestsellers' | 'new'>('bestsellers');
  const bestsellers = getBestsellers();
  const newArrivals = PRODUCTS.filter((p) => p.isNew);
  const displayedProducts = activeTab === 'bestsellers' ? bestsellers : newArrivals;

  return (
    <div className="space-y-12 sm:space-y-14 lg:space-y-16 pb-14 sm:pb-20">
      {/* 1. Hero Section matching the Reference Aesthetic */}
      <section className="pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
              {/* Reference-Style Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4E5E3] shadow-soft text-[#0B4145] text-xs sm:text-sm font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#128F92]" />
                <span>Premier Botanical Cosmetics &bull; Handcrafted in Jaipur</span>
              </div>

              {/* Dominant Calibrated Headline (72px max on large desktop) */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl xl:text-7xl text-[#0B4145] leading-[1.08] font-bold tracking-tight">
                Restoring Radiance. <br />
                <span className="italic font-normal text-[#128F92]">Elevating Beauty.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-sm sm:text-base lg:text-lg text-[#687F8D] leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                Experience royal heritage botanicals perfected through modern French cosmetic science. Discover opulent pigments, cellular serums, and weightless velvet textures.
              </p>

              {/* Calibrated Action Buttons (46–48px Height) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                {/* Primary Teal CTA */}
                <Link
                  href="/collections"
                  className="w-full sm:w-auto h-[46px] sm:h-[48px] px-6 sm:px-7 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-cta flex items-center justify-center gap-2 group hover:scale-102"
                >
                  <span>Shop Collections</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Secondary Pill CTA */}
                <Link
                  href="/brands"
                  className="w-full sm:w-auto h-[46px] sm:h-[48px] px-6 sm:px-7 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] border border-[#D4E5E3] text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-card flex items-center justify-center hover:scale-102"
                >
                  <span>Explore Brands</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-[#0B4145] font-bold">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#D4E5E3] shadow-soft">
                  <div className="flex text-[#128F92]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span>4.9 / 5 Rating</span>
                </div>

                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#D4E5E3] shadow-soft">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#128F92]" />
                  <span>Dermatologist Tested</span>
                </div>

                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#D4E5E3] shadow-soft">
                  <Award className="w-3.5 h-3.5 text-[#128F92]" />
                  <span>100% Cruelty-Free</span>
                </div>
              </div>
            </div>

            {/* Right Editorial Image with Floating Reference-Style Badges */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] w-full max-w-md xl:max-w-lg mx-auto rounded-[28px] overflow-hidden shadow-[0_14px_36px_rgba(11,65,69,0.10)] border-4 border-white bg-white">
                <Image
                  src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop"
                  alt="Majisa Cosmetics Beauty Showcase"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />

                {/* Floating Top Badge */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-soft border border-[#D4E5E3] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#DDF3F2] flex items-center justify-center text-[#128F92] shrink-0 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-[#0B4145]">
                      100% Clean Bio-Actives
                    </p>
                    <p className="text-[10px] text-[#687F8D] font-medium">
                      Zero toxins &bull; Hypoallergenic
                    </p>
                  </div>
                </div>

                {/* Floating Bottom Review Pill */}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-soft border border-[#D4E5E3] max-w-[200px]">
                  <div className="flex text-[#128F92] mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <p className="text-[11px] text-[#0B4145] font-bold leading-tight">
                    &ldquo;Transformed my skin texture completely.&rdquo;
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Shop by Category - Larger Cards & Spacious Visual Hierarchy */}
      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 pb-3.5 sm:pb-4 border-b border-[#DDF3F2]">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#128F92] font-extrabold block mb-1">
              Curated Avenues
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#0B4145] font-bold">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/collections"
            className="mt-4 sm:mt-0 text-xs sm:text-sm font-bold text-[#128F92] hover:text-[#0B4145] tracking-wider uppercase inline-flex items-center gap-2 transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 lg:gap-6">
          {CATEGORIES.slice(0, 6).map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* 3. Bestsellers & Featured Products - Large Prominent Pill Tabs & Spacious Grid */}
      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 pb-3.5 sm:pb-4 border-b border-[#DDF3F2] gap-3.5 sm:gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#128F92] font-extrabold block mb-1">
              Most Loved Formulations
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#0B4145] font-bold">
              Featured Formulations
            </h2>
          </div>

          {/* Prominent Calibrated Pill Tab Control */}
          <div className="flex items-center p-1 bg-white rounded-full border border-[#D4E5E3] shadow-soft">
            <button
              type="button"
              onClick={() => setActiveTab('bestsellers')}
              className={`px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'bestsellers'
                  ? 'bg-[#128F92] text-white shadow-cta'
                  : 'text-[#687F8D] hover:text-[#0B4145]'
              }`}
            >
              Bestsellers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className={`px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'new'
                  ? 'bg-[#128F92] text-white shadow-cta'
                  : 'text-[#687F8D] hover:text-[#0B4145]'
              }`}
            >
              New Arrivals
            </button>
          </div>
        </div>

        {/* Calibrated Product Cards with Uncropped Product Visuals */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 lg:gap-6">
          {displayedProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-10">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2.5 h-[44px] sm:h-[46px] px-7 sm:px-8 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] border border-[#D4E5E3] text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-card hover:scale-102"
          >
            <span>Explore Entire Catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. Soft Aqua Feature: The Majisa Standard Container */}
      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="bg-[#DDF3F2]/55 rounded-[28px] border border-[#BCE7E5] p-6 sm:p-9 lg:p-12 shadow-[0_12px_35px_rgba(11,65,69,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Image */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden shadow-card border-4 border-white max-w-sm mx-auto bg-white">
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
            <div className="lg:col-span-7 space-y-4.5 sm:space-y-5">
              <span className="text-xs uppercase tracking-widest text-[#128F92] font-extrabold block">
                The Majisa Standard
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#0B4145] font-bold leading-tight">
                Skin-First Purity, <br />
                <span className="italic font-normal text-[#128F92]">Cruelty-Free Luxury</span>
              </h2>

              <p className="text-sm sm:text-base text-[#687F8D] leading-relaxed font-medium">
                We believe cosmetics should nourish your skin from within. Every Majisa formula is powered by biocompatible botanicals—cold-pressed seed oils, protective squalane, and skin-adaptive mineral pigments.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                <div className="p-4 sm:p-4.5 rounded-[18px] bg-white border border-[#D4E5E3] shadow-soft">
                  <h4 className="font-serif text-base sm:text-lg font-bold text-[#0B4145] mb-1">
                    Heritage Botanicals
                  </h4>
                  <p className="text-xs text-[#687F8D] leading-relaxed font-medium">
                    Saffron, gotu kola, and rosehip harvested from ethical cooperative farms.
                  </p>
                </div>

                <div className="p-4 sm:p-4.5 rounded-[18px] bg-white border border-[#D4E5E3] shadow-soft">
                  <h4 className="font-serif text-base sm:text-lg font-bold text-[#0B4145] mb-1">
                    Clean Science
                  </h4>
                  <p className="text-xs text-[#687F8D] leading-relaxed font-medium">
                    Zero parabens, sulfates, or microplastics. Dermatologically tested for sensitive skin.
                  </p>
                </div>
              </div>

              <div className="pt-1.5">
                <Link
                  href="/collections/skincare"
                  className="inline-flex items-center gap-2 h-[44px] sm:h-[46px] px-7 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-cta"
                >
                  <span>Discover Skincare Elixirs</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Shop by Brand - Distinct White Cards */}
      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 pb-3.5 sm:pb-4 border-b border-[#DDF3F2]">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#128F92] font-extrabold block mb-1">
              Atelier Houses
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#0B4145] font-bold">
              Available Brands
            </h2>
          </div>
          <Link
            href="/brands"
            className="mt-3 sm:mt-0 text-xs sm:text-sm font-bold text-[#128F92] hover:text-[#0B4145] tracking-wider uppercase inline-flex items-center gap-2 transition-colors"
          >
            <span>View All Brands</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {BRANDS.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      </section>

      {/* 6. Concierge Assistance Touchpoint on Homepage */}
      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="bg-white rounded-[24px] p-5 sm:p-7 lg:p-9 border border-[#D4E5E3] shadow-card flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 text-center md:text-left">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-xs uppercase tracking-widest text-[#128F92] font-extrabold block">
              Personalized Beauty Advisory
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-[#0B4145] font-bold">
              Looking for Shade Guidance or Gifting Consultations?
            </h2>
            <p className="text-xs sm:text-sm text-[#687F8D] font-medium leading-relaxed">
              Our dedicated beauty advisors are available to guide you to the perfect formulation for your tone and ritual.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/contact"
              className="h-[44px] sm:h-[46px] px-6 sm:px-7 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-cta inline-flex items-center gap-2"
            >
              <span>Connect With Concierge</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={CONTACT_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[44px] sm:h-[46px] px-5 sm:px-6 rounded-full bg-[#DDF3F2] hover:bg-[#128F92] text-[#0B4145] hover:text-white border border-[#BCE7E5] text-xs sm:text-sm uppercase tracking-wider font-bold transition-all inline-flex items-center gap-2"
              aria-label="Chat with Majisa Cosmetics on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-[#128F92] group-hover:text-white" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}