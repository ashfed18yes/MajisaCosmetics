import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { getCategoryBySlug, getProductsByCategory, CATEGORIES } from '@/data/mockData';
import ProductGrid from '@/components/product/ProductGrid';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: 'Category Not Found | Majisa Cosmetics' };

  return {
    title: `${category.name} | Majisa Cosmetics`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const products = getProductsByCategory(category.slug);

  return (
    <div className="space-y-12 sm:space-y-14 pb-24">
      {/* Category Hero Banner as an Elevated Card */}
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2">
        <div className="relative bg-[#0B4145] text-white rounded-[36px] overflow-hidden py-16 sm:py-22 px-8 sm:px-12 lg:px-16 shadow-[0_16px_40px_rgba(11,65,69,0.12)]">
          <div className="absolute inset-0 opacity-20">
            <Image
              src={category.image}
              alt={category.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#083336] via-[#0B4145]/85 to-transparent" />

          <div className="relative max-w-3xl">
            {/* Breadcrumbs */}
            <nav className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#DDF3F2] font-bold mb-6 tracking-wide bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#BCE7E5]" />
              <Link href="/collections" className="hover:text-white transition-colors">
                Collections
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#BCE7E5]" />
              <span className="text-white font-extrabold">{category.name}</span>
            </nav>

            <span className="block text-xs uppercase tracking-widest text-[#BCE7E5] font-extrabold mb-2.5">
              {category.tagline}
            </span>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-wide mb-3.5">
              {category.name}
            </h1>

            <p className="text-base sm:text-lg text-[#DDF3F2] font-medium leading-relaxed max-w-2xl">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      {/* Product Grid Section */}
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Toolbar Header Card */}
        <div className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#D4E5E3] shadow-card flex items-center justify-between mb-8 sm:mb-10">
          <p className="text-sm font-bold text-[#687F8D]">
            Showing <span className="text-[#0B4145] font-extrabold">{products.length}</span> formulations in this curation
          </p>

          <Link
            href="/collections"
            className="text-xs sm:text-sm font-bold text-[#128F92] hover:text-[#0B4145] underline tracking-wider uppercase"
          >
            Browse All Collections &rarr;
          </Link>
        </div>

        <ProductGrid
          products={products}
          columns="grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          emptyTitle={`No items in ${category.name} currently`}
          emptyDescription="Our atelier is preparing new seasonal formulations for this category."
        />
      </div>

      {/* Sibling Category Quick Links - Distinct White Cards */}
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-12 border-t border-[#DDF3F2]">
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B4145] mb-6">
          Explore Other Categories
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
          {CATEGORIES.filter((c) => c.slug !== category.slug).slice(0, 5).map((sibling) => (
            <Link
              key={sibling.id}
              href={`/collections/${sibling.slug}`}
              className="p-5 rounded-[26px] bg-white hover:bg-[#F0F9F8] border border-[#D4E5E3] hover:border-[#128F92] text-center transition-all group shadow-card hover:shadow-hover"
            >
              <p className="font-serif text-lg font-bold text-[#0B4145] group-hover:text-[#128F92] transition-colors">
                {sibling.name}
              </p>
              <p className="text-xs text-[#687F8D] line-clamp-1 mt-1 font-medium">
                {sibling.tagline}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}