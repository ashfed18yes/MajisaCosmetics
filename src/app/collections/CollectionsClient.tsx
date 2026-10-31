'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, X, Search, SlidersHorizontal, ArrowUpDown, RotateCcw } from 'lucide-react';
import { Product, Category, Brand } from '@/types';
import ProductGrid from '@/components/product/ProductGrid';

interface CollectionsClientProps {
  initialProducts: Product[];
  categories: Category[];
  brands: Brand[];
}

export default function CollectionsClient({
  initialProducts,
  categories,
  brands,
}: CollectionsClientProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialBrand = searchParams.get('brand') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'makeup') {
          if (!['lipsticks', 'face-makeup', 'eye-makeup'].includes(product.categorySlug.toLowerCase())) {
            return false;
          }
        } else if (product.categorySlug.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Brand filter
      if (selectedBrand !== 'all' && product.brandSlug.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }

      // Price filter
      if (product.price > maxPrice) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = product.name.toLowerCase().includes(q);
        const matchBrand = product.brand.toLowerCase().includes(q);
        const matchCat = product.category.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchCat) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [initialProducts, selectedCategory, selectedBrand, maxPrice, searchQuery, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setMaxPrice(10000);
    setSortBy('featured');
    setVisibleCount(12);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    searchQuery.trim() !== '' ||
    maxPrice < 10000 ||
    sortBy !== 'featured';

  return (
    <div className="max-w-[1420px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-7 sm:py-12 space-y-7 sm:space-y-9">
      {/* 1. Spacious Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
        <span className="text-xs uppercase tracking-widest text-[#128F92] font-extrabold block mb-1.5">
          Curated Catalog
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#0B4145] font-bold tracking-tight">
          The Beauty Collections
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-[#687F8D] font-medium leading-relaxed">
          Explore our complete collection of botanical lipsticks, cellular hydration skincare, and artisanal fragrances.
        </p>
      </div>

      {/* 2. Spacious Controls & Search Toolbar */}
      <div className="bg-white rounded-[20px] border border-[#D4E5E3] shadow-card p-3.5 sm:p-4.5 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3.5">
          {/* Search bar */}
          <div className="relative w-full md:w-88">
            <Search className="w-4 h-4 text-[#128F92] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, brand, or formula..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-full text-xs sm:text-sm text-[#0B4145] placeholder-[#687F8D]/70 focus:outline-none focus:border-[#128F92] transition-colors font-semibold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#687F8D] hover:text-[#0B4145]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#DDF3F2] text-[#0B4145] text-xs font-bold transition-colors"
            >
              <Filter className="w-3.5 h-3.5 text-[#128F92]" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#128F92]" />
              )}
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-[#687F8D] font-bold hidden sm:inline">Sort:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none pl-3.5 pr-8 py-2 bg-[#F0F9F8] border border-[#DDF3F2] rounded-full text-xs sm:text-sm text-[#0B4145] font-bold focus:outline-none focus:border-[#128F92] cursor-pointer"
                >
                  <option value="featured">Featured Curations</option>
                  <option value="newest">New Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-[#128F92] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Counter */}
            <div className="text-xs sm:text-sm text-[#687F8D] font-bold bg-[#F0F9F8] px-3.5 py-1.5 rounded-full border border-[#DDF3F2] shrink-0">
              <span className="text-[#0B4145] font-extrabold">{filteredProducts.length}</span> items
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2.5 pt-4 mt-4 border-t border-[#DDF3F2]">
            <span className="text-xs uppercase tracking-wider text-[#687F8D] font-extrabold mr-1">
              Active:
            </span>

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DDF3F2] border border-[#BCE7E5] text-xs font-bold text-[#0B4145]">
                Category: {categories.find((c) => c.slug.toLowerCase() === selectedCategory.toLowerCase())?.name || selectedCategory}
                <button onClick={() => setSelectedCategory('all')}>
                  <X className="w-3.5 h-3.5 hover:text-red-600" />
                </button>
              </span>
            )}

            {selectedBrand !== 'all' && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DDF3F2] border border-[#BCE7E5] text-xs font-bold text-[#0B4145]">
                Brand: {brands.find((b) => b.slug.toLowerCase() === selectedBrand.toLowerCase())?.name || selectedBrand}
                <button onClick={() => setSelectedBrand('all')}>
                  <X className="w-3.5 h-3.5 hover:text-red-600" />
                </button>
              </span>
            )}

            {maxPrice < 10000 && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DDF3F2] border border-[#BCE7E5] text-xs font-bold text-[#0B4145]">
                Under ₹{maxPrice.toLocaleString('en-IN')}
                <button onClick={() => setMaxPrice(10000)}>
                  <X className="w-3.5 h-3.5 hover:text-red-600" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DDF3F2] border border-[#BCE7E5] text-xs font-bold text-[#0B4145]">
                &ldquo;{searchQuery}&rdquo;
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-3.5 h-3.5 hover:text-red-600" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-xs text-[#128F92] hover:underline font-bold ml-auto flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Rebalanced Layout: Balanced 240-250px Sidebar + Wide Dominant Product Grid */}
      <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
        {/* Desktop Sidebar: Clean, Balanced ~240-250px Width, Doesn't Dominate */}
        <aside className="hidden lg:block w-[230px] xl:w-[245px] shrink-0 sticky top-20">
          <div className="bg-white rounded-[20px] p-4.5 border border-[#D4E5E3] shadow-card space-y-4.5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#DDF3F2]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#128F92]" />
                <h3 className="font-serif text-lg text-[#0B4145] font-bold">
                  Filters
                </h3>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-[#128F92] font-bold hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#687F8D] mb-2.5">
                Category
              </h4>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-[#128F92] text-white font-bold shadow-cta'
                      : 'text-[#0B4145] hover:bg-[#F0F9F8] font-semibold'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-xs opacity-75">{initialProducts.length}</span>
                </button>
                {categories.map((cat) => {
                  const count = initialProducts.filter(
                    (p) => p.categorySlug.toLowerCase() === cat.slug.toLowerCase()
                  ).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full text-left px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-between ${
                        selectedCategory.toLowerCase() === cat.slug.toLowerCase()
                          ? 'bg-[#128F92] text-white font-bold shadow-cta'
                          : 'text-[#0B4145] hover:bg-[#F0F9F8] font-semibold'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-xs opacity-75 ml-1">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="pt-3.5 border-t border-[#DDF3F2]">
              <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#687F8D] mb-2.5">
                Brand
              </h4>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedBrand('all')}
                  className={`w-full text-left px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-between ${
                    selectedBrand === 'all'
                      ? 'bg-[#128F92] text-white font-bold shadow-cta'
                      : 'text-[#0B4145] hover:bg-[#F0F9F8] font-semibold'
                  }`}
                >
                  <span>All Brands</span>
                </button>
                {brands.map((brand) => {
                  const count = initialProducts.filter(
                    (p) => p.brandSlug.toLowerCase() === brand.slug.toLowerCase()
                  ).length;
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => setSelectedBrand(brand.slug)}
                      className={`w-full text-left px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-between ${
                        selectedBrand.toLowerCase() === brand.slug.toLowerCase()
                          ? 'bg-[#128F92] text-white font-bold shadow-cta'
                          : 'text-[#0B4145] hover:bg-[#F0F9F8] font-semibold'
                      }`}
                    >
                      <span className="truncate">{brand.name}</span>
                      <span className="text-xs opacity-75 ml-1">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-3.5 border-t border-[#DDF3F2]">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#687F8D]">
                  Max Price
                </h4>
                <span className="text-xs sm:text-sm font-extrabold text-[#0B4145]">
                  ₹{maxPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="250"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#128F92] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#687F8D] mt-1 font-bold">
                <span>₹500</span>
                <span>₹10,000</span>
              </div>
            </div>
          </div>
        </aside>

        {/* 4. Dominant Product Grid: Majority of Width, 4-Column on Desktops */}
        <div className="flex-1 min-w-0 space-y-7">
          <ProductGrid
            products={displayedProducts}
            onResetFilters={hasActiveFilters ? handleResetFilters : undefined}
            columns="grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
          />

          {hasMore && (
            <div className="text-center pt-6">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 8)}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] border border-[#D4E5E3] text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-card hover:scale-102"
              >
                <span>Load More Formulations ({filteredProducts.length - visibleCount} remaining)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0B4145]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-modal p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#DDF3F2]">
                <h3 className="font-serif text-lg font-bold text-[#0B4145]">
                  Filter Catalog
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full text-[#687F8D] hover:text-[#0B4145]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-[#687F8D] mb-3">
                  Categories
                </h4>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsMobileFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold ${
                      selectedCategory === 'all'
                        ? 'bg-[#128F92] text-white'
                        : 'text-[#0B4145] hover:bg-[#F0F9F8]'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold ${
                        selectedCategory.toLowerCase() === cat.slug.toLowerCase()
                          ? 'bg-[#128F92] text-white'
                          : 'text-[#0B4145] hover:bg-[#F0F9F8]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div className="pt-4 border-t border-[#DDF3F2]">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-[#687F8D] mb-3">
                  Brands
                </h4>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand('all');
                      setIsMobileFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold ${
                      selectedBrand === 'all'
                        ? 'bg-[#128F92] text-white'
                        : 'text-[#0B4145] hover:bg-[#F0F9F8]'
                    }`}
                  >
                    All Brands
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBrand(b.slug);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold ${
                        selectedBrand.toLowerCase() === b.slug.toLowerCase()
                          ? 'bg-[#128F92] text-white'
                          : 'text-[#0B4145] hover:bg-[#F0F9F8]'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="pt-4 border-t border-[#DDF3F2]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-[#687F8D]">
                    Max Price
                  </h4>
                  <span className="text-sm font-extrabold text-[#0B4145]">
                    ₹{maxPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="250"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#128F92]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#DDF3F2] flex gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-3.5 rounded-full border border-[#DDF3F2] text-xs uppercase font-bold text-[#0B4145]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3.5 rounded-full bg-[#128F92] text-white text-xs uppercase font-bold shadow-cta"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

