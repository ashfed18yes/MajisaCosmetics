import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, MapPin, Calendar, Sparkles } from 'lucide-react';
import { getBrandBySlug, getProductsByBrand, BRANDS } from '@/data/mockData';
import ProductGrid from '@/components/product/ProductGrid';

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BRANDS.map((brand) => ({
    slug: brand.slug,
  }));
}

export async function generateMetadata({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return { title: 'Brand Not Found | Majisa Cosmetics' };

  return {
    title: `${brand.name} | Majisa Cosmetics`,
    description: brand.description,
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  const products = getProductsByBrand(brand.slug);

  return (
    <div className="space-y-12 sm:space-y-14 pb-24">
      {/* Brand Hero Banner as an Elevated Card */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2">
        <div className="relative bg-[#0B4145] text-white rounded-[36px] overflow-hidden py-16 sm:py-22 px-8 sm:px-12 lg:px-16 shadow-[0_16px_40px_rgba(11,65,69,0.12)]">
          <div className="absolute inset-0 opacity-20">
            <Image
              src={brand.banner}
              alt={brand.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B4145] via-[#0B4145]/85 to-transparent" />

          <div className="relative max-w-3xl space-y-4">
            {/* Breadcrumbs */}
            <nav className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#DDF3F2] font-bold mb-4 tracking-wide bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#DDF3F2]/60" />
              <Link href="/brands" className="hover:text-white transition-colors">
                Brands
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#DDF3F2]/60" />
              <span className="text-white font-bold">{brand.name}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {brand.origin && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#DDF3F2] font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-[#128F92]" />
                  <span>{brand.origin}</span>
                </span>
              )}
              {brand.founded && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#DDF3F2] font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-[#128F92]" />
                  <span>Est. {brand.founded}</span>
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              {brand.name}
            </h1>

            <p className="text-base sm:text-lg text-[#DDF3F2] font-serif italic">
              &ldquo;{brand.tagline}&rdquo;
            </p>

            <p className="text-sm sm:text-base text-white/80 font-normal leading-relaxed max-w-2xl">
              {brand.description}
            </p>
          </div>
        </div>
      </div>

      {/* Brand Products Section */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Toolbar Header Card */}
        <div className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#D4E5E3] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF3F2] text-[#128F92] text-xs font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3 text-[#128F92]" />
              Formulations by {brand.name}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#0B4145] font-bold">
              Signature Collection
            </h2>
          </div>
          <span className="text-xs sm:text-sm text-[#687F8D] font-bold bg-[#F0F9F8] px-4 py-2 rounded-full border border-[#DDF3F2] shadow-xs self-start sm:self-auto">
            {products.length} {products.length === 1 ? 'Creation' : 'Creations'} Available
          </span>
        </div>

        <ProductGrid
          products={products}
          columns="grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          emptyTitle={`No products currently available for ${brand.name}`}
          emptyDescription="This brand atelier is currently formulating new seasonal offerings."
        />
      </div>

      {/* Other Brands Section - Distinct White Cards */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-12 border-t border-[#DDF3F2]">
        <h3 className="font-serif text-2xl sm:text-3xl text-[#0B4145] font-bold mb-6">
          Explore Other Prestigious Brands
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {BRANDS.filter((b) => b.slug !== brand.slug).slice(0, 3).map((other) => (
            <Link
              key={other.id}
              href={`/brands/${other.slug}`}
              className="p-6 sm:p-7 rounded-[28px] bg-white border border-[#D4E5E3] hover:border-[#128F92] hover:shadow-hover transition-all flex flex-col justify-between group shadow-card"
            >
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#128F92]">
                  {other.origin}
                </span>
                <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#0B4145] group-hover:text-[#128F92] transition-colors mt-1.5">
                  {other.name}
                </h4>
                <p className="text-xs sm:text-sm text-[#687F8D] line-clamp-2 mt-2 leading-relaxed font-medium">
                  {other.tagline}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#DDF3F2] flex items-center justify-between text-xs font-bold text-[#128F92]">
                <span>View Collection</span>
                <span className="group-hover:translate-x-1.5 transition-transform">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}