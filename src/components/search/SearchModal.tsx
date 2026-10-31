'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ArrowRight } from 'lucide-react';
import { PRODUCTS as MOCK_PRODUCTS, CATEGORIES as MOCK_CATEGORIES, BRANDS as MOCK_BRANDS } from '@/data/mockData';
import { createClient } from '@/lib/supabase/client';
import { Product, Category, Brand } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(MOCK_BRANDS);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';

      // Load latest live catalog from Supabase
      try {
        const supabase = createClient();
        Promise.all([
          supabase
            .from('products')
            .select('*, brands(name, slug), categories(name, slug), product_images(*)')
            .eq('is_available', true),
          supabase.from('categories').select('*').eq('is_active', true),
          supabase.from('brands').select('*').eq('is_active', true),
        ]).then(([{ data: rawProds }, { data: rawCats }, { data: rawBrands }]) => {
          if (rawProds && rawProds.length > 0) {
            const liveProds: Product[] = rawProds.map((p: any) => ({
              id: p.id,
              slug: p.slug,
              name: p.name,
              brand: p.brands?.name || 'Majisa Signature',
              brandSlug: p.brands?.slug || 'majisa',
              category: p.categories?.name || 'General',
              categorySlug: p.categories?.slug || 'all',
              price: Number(p.base_price),
              originalPrice: p.original_price ? Number(p.original_price) : undefined,
              rating: Number(p.rating || 5.0),
              reviewCount: Number(p.review_count || 0),
              description: p.description || '',
              details: [],
              images: (p.product_images || []).map((img: any) => img.secure_url).filter(Boolean),
              isAvailable: p.is_available,
            }));
            const liveSlugs = new Set(liveProds.map((p) => p.slug));
            setProducts([...liveProds, ...MOCK_PRODUCTS.filter((m) => !liveSlugs.has(m.slug))]);
          }

          if (rawCats && rawCats.length > 0) {
            const liveCats: Category[] = rawCats.map((c: any) => ({
              id: c.id,
              slug: c.slug,
              name: c.name,
              tagline: c.tagline || '',
              description: c.description || '',
              image: c.image_url || '',
            }));
            const liveSlugs = new Set(liveCats.map((c) => c.slug));
            setCategories([...liveCats, ...MOCK_CATEGORIES.filter((m) => !liveSlugs.has(m.slug))]);
          }

          if (rawBrands && rawBrands.length > 0) {
            const liveBrands: Brand[] = rawBrands.map((b: any) => ({
              id: b.id,
              slug: b.slug,
              name: b.name,
              tagline: b.tagline || '',
              description: b.description || '',
              logo: b.logo_url || '',
              banner: b.banner_url || '',
              origin: b.origin || 'Jaipur',
            }));
            const liveSlugs = new Set(liveBrands.map((b) => b.slug));
            setBrands([...liveBrands, ...MOCK_BRANDS.filter((m) => !liveSlugs.has(m.slug))]);
          }
        });
      } catch {}
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchedProducts = trimmed
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          p.brand.toLowerCase().includes(trimmed) ||
          p.category.toLowerCase().includes(trimmed)
      ).slice(0, 5)
    : [];

  const matchedCategories = trimmed
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(trimmed) ||
          c.description.toLowerCase().includes(trimmed)
      ).slice(0, 3)
    : [];

  const matchedBrands = trimmed
    ? brands.filter(
        (b) =>
          b.name.toLowerCase().includes(trimmed) ||
          b.description.toLowerCase().includes(trimmed)
      ).slice(0, 3)
    : [];

  const popularSearches = ['Velvet Matte', 'Hyaluronic Elixir', 'SPF 50', 'Rose Oud', 'Lumière', 'Palette'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-[#0B4145]/40 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-xl bg-white rounded-[22px] shadow-modal border border-[#D4E5E3] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4.5 py-3 border-b border-[#DDF3F2] bg-white">
          <Search className="w-5 h-5 text-[#128F92] mr-3.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, or categories..."
            className="w-full bg-transparent text-[#0B4145] placeholder-[#687F8D]/70 text-base focus:outline-none font-semibold"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-[#687F8D] hover:text-[#0B4145] p-1 mr-2"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-wider font-bold text-[#687F8D] hover:text-[#0B4145] px-3 py-1.5 rounded-full bg-[#F0F9F8] border border-[#DDF3F2]"
          >
            Esc
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {trimmed === '' ? (
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-[#687F8D] mb-3">
                Trending Searches
              </p>
              <div className="flex flex-wrap gap-2.5 mb-6">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="text-xs sm:text-sm font-bold px-4 py-2 rounded-full bg-[#F0F9F8] hover:bg-[#DDF3F2] text-[#0B4145] border border-[#DDF3F2] transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold tracking-wider uppercase text-[#687F8D] mb-3">
                Featured Categories
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.slice(0, 6).map((cat: Category) => (
                  <Link
                    key={cat.id}
                    href={`/collections/${cat.slug}`}
                    onClick={onClose}
                    className="p-3.5 rounded-2xl bg-[#F0F9F8] hover:bg-[#DDF3F2] border border-[#DDF3F2] text-sm text-[#0B4145] font-bold flex items-center justify-between group transition-colors"
                  >
                    <span>{cat.name}</span>
                    <ArrowRight className="w-4 h-4 text-[#128F92] group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product matches */}
              {matchedProducts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold tracking-wider uppercase text-[#687F8D]">
                      Products ({matchedProducts.length})
                    </p>
                    <Link
                      href={`/collections?search=${encodeURIComponent(query)}`}
                      onClick={onClose}
                      className="text-xs text-[#128F92] font-bold hover:underline"
                    >
                      View all results
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {matchedProducts.map((prod) => (
                      <Link
                        key={prod.id}
                        href={`/products/${prod.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-[#F0F9F8] transition-colors group"
                      >
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#F0F9F8] shrink-0 border border-[#DDF3F2] flex items-center justify-center p-1">
                          <Image
                            src={prod.images[0]}
                            alt={prod.name}
                            fill
                            sizes="56px"
                            className="object-contain p-1 group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] uppercase tracking-wider text-[#687F8D] font-bold">
                            {prod.brand}
                          </p>
                          <h4 className="text-sm font-bold text-[#0B4145] truncate">
                            {prod.name}
                          </h4>
                          <span className="text-xs font-bold text-[#128F92]">
                            ₹{prod.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand matches */}
              {matchedBrands.length > 0 && (
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase text-[#687F8D] mb-2">
                    Brands
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matchedBrands.map((b) => (
                      <Link
                        key={b.id}
                        href={`/brands/${b.slug}`}
                        onClick={onClose}
                        className="px-4 py-2 rounded-full bg-[#F0F9F8] hover:bg-[#DDF3F2] border border-[#DDF3F2] text-xs sm:text-sm font-bold text-[#0B4145] transition-colors"
                      >
                        {b.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Category matches */}
              {matchedCategories.length > 0 && (
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase text-[#687F8D] mb-2">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matchedCategories.map((c) => (
                      <Link
                        key={c.id}
                        href={`/collections/${c.slug}`}
                        onClick={onClose}
                        className="px-4 py-2 rounded-full bg-[#F0F9F8] hover:bg-[#DDF3F2] border border-[#DDF3F2] text-xs sm:text-sm font-bold text-[#0B4145] transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {matchedProducts.length === 0 &&
                matchedBrands.length === 0 &&
                matchedCategories.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-sm text-[#0B4145] font-bold mb-1">
                      No results found for &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-xs text-[#687F8D]">
                      Try searching with different terms like &ldquo;lipstick&rdquo;, &ldquo;elixir&rdquo;, or &ldquo;sunscreen&rdquo;.
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
