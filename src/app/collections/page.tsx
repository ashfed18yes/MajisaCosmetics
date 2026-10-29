'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, X, Search, SlidersHorizontal, ArrowUpDown, RotateCcw } from 'lucide-react';
import { PRODUCTS, CATEGORIES, BRANDS } from '@/data/mockData';
import ProductGrid from '@/components/product/ProductGrid';

function CollectionsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialBrand = searchParams.get('brand') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [maxPrice, setMaxPrice] = useState<number>(6000);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'makeup') {
          if (!['lipsticks', 'face-makeup', 'eye-makeup'].includes(product.categorySlug)) {
            return false;
          }
        } else if (product.categorySlug !== selectedCategory) {
          return false;
        }
      }

      // Brand filter
      if (selectedBrand !== 'all' && product.brandSlug !== selectedBrand) {
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
  }, [selectedCategory, selectedBrand, maxPrice, searchQuery, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setMaxPrice(6000);
    setSortBy('featured');
    setVisibleCount(8);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    searchQuery.trim() !== '' ||
    maxPrice < 6000 ||
    sortBy !== 'featured';

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-16 space-y-10 sm:space-y-12">
      {/* 1. Spacious Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
        <span className="text-xs uppercase tracking-widest text-[#128F92] font-extrabold block mb-2">
          Curated Catalog
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#0B4145] font-bold tracking-tight">
          The Beauty Collections
        </h1>
        <p className="mt-3.5 text-base sm:text-lg text-[#687F8D] font-medium leading-relaxed">
          Explore our complete collection of botanical lipsticks, cellular hydration skincare, and artisanal fragrances.
        </p>
      </div>

      {/* 2. Spacious Controls & Search Toolbar */}
      <div className="bg-white rounded-[28px] border border-[#D4E5E3] shadow-card p-5 sm:p-6 mb-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#128F92] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, brand, or formula..."
              className="w-full pl-11 pr-10 py-3 bg-[#F0F9F8] border border-[#DDF3F2] rounded-full text-sm text-[#0B4145] placeholder-[#687F8D]/70 focus:outline-none focus:border-[#128F92] transition-colors font-semibold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#687F8D] hover:text-[#0B4145]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3.5">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DDF3F2] text-[#0B4145] text-xs font-bold transition-colors"
            >
              <Filter className="w-4 h-4 text-[#128F92]" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#128F92]" />
              )}
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-[#687F8D] font-bold hidden sm:inline">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-full text-sm text-[#0B4145] font-bold focus:outline-none focus:border-[#128F92] cursor-pointer"
                >
                  <option value="featured">Featured Curations</option>
                  <option value="newest">New Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-[#128F92] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Counter */}
            <div className="text-sm text-[#687F8D] font-bold bg-[#F0F9F8] px-4 py-2 rounded-full border border-[#DDF3F2] shrink-0">
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
                Category: {CATEGORIES.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                <button onClick={() => setSelectedCategory('all')}>
                  <X className="w-3.5 h-3.5 hover:text-red-600" />
                </button>
              </span>
            )}

            {selectedBrand !== 'all' && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DDF3F2] border border-[#BCE7E5] text-xs font-bold text-[#0B4145]">
                Brand: {BRANDS.find((b) => b.slug === selectedBrand)?.name || selectedBrand}
                <button onClick={() => setSelectedBrand('all')}>
                  <X className="w-3.5 h-3.5 hover:text-red-600" />
                </button>
              </span>
            )}

            {maxPrice < 6000 && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DDF3F2] border border-[#BCE7E5] text-xs font-bold text-[#0B4145]">
                Under ₹{maxPrice.toLocaleString('en-IN')}
                <button onClick={() => setMaxPrice(6000)}>
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
      <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10 xl:gap-12">
        {/* Desktop Sidebar: Clean, Balanced ~240-250px Width, Doesn't Dominate */}
        <aside className="hidden lg:block w-[240px] xl:w-[250px] shrink-0 space-y-6 sticky top-28">
          <div className="bg-white rounded-[28px] p-6 border border-[#D4E5E3] shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDF3F2]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#128F92]" />
                <h3 className="font-serif text-xl text-[#0B4145] font-bold">
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
              <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#687F8D] mb-3">
                Category
              </h4>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm transition-all flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-[#128F92] text-white font-bold shadow-cta'
                      : 'text-[#0B4145] hover:bg-[#F0F9F8] font-semibold'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-xs opacity-75">{PRODUCTS.length}</span>
                </button>
                {CATEGORIES.map((cat) => {
                  const count = PRODUCTS.filter((p) => p.categorySlug === cat.slug).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm transition-all flex items-center justify-between ${
                        selectedCategory === cat.slug
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
            <div className="pt-4 border-t border-[#DDF3F2]">
              <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#687F8D] mb-3">
                Brand
              </h4>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedBrand('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm transition-all flex items-center justify-between ${
                    selectedBrand === 'all'
                      ? 'bg-[#128F92] text-white font-bold shadow-cta'
                      : 'text-[#0B4145] hover:bg-[#F0F9F8] font-semibold'
                  }`}
                >
                  <span>All Brands</span>
                </button>
                {BRANDS.map((brand) => {
                  const count = PRODUCTS.filter((p) => p.brandSlug === brand.slug).length;
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => setSelectedBrand(brand.slug)}
                      className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm transition-all flex items-center justify-between ${
                        selectedBrand === brand.slug
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
            <div className="pt-4 border-t border-[#DDF3F2]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#687F8D]">
                  Max Price
                </h4>
                <span className="text-sm font-extrabold text-[#0B4145]">
                  ₹{maxPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="6000"
                step="200"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#128F92] cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[#687F8D] mt-1 font-bold">
                <span>₹1,000</span>
                <span>₹6,000</span>
              </div>
            </div>
          </div>
        </aside>

        {/* 4. Dominant Product Grid: Majority of Width, 4-Column on Desktops */}
        <div className="flex-1 min-w-0 space-y-10">
          <ProductGrid
            products={displayedProducts}
            onResetFilters={hasActiveFilters ? handleResetFilters : undefined}
            columns="grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
          />

          {hasMore && (
            <div className="text-center pt-8">
              <p className="text-sm text-[#687F8D] font-medium mb-3.5">
                Showing {displayedProducts.length} of {filteredProducts.length} formulations
              </p>
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 8)}
                className="h-[56px] px-10 rounded-full bg-white hover:bg-[#DDF3F2] text-[#0B4145] border border-[#D4E5E3] text-sm uppercase tracking-wider font-bold transition-all shadow-card hover:scale-102"
              >
                Load More Formulations
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#0B4145]/40 backdrop-blur-sm">
          <div className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white shadow-2xl flex flex-col p-6 overflow-y-auto border-l border-[#D4E5E3]">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDF3F2]">
              <h3 className="font-serif text-2xl text-[#0B4145] font-bold">
                Filters
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 rounded-full text-[#0B4145] hover:bg-[#F0F9F8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-6 flex-1">
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#687F8D] mb-2.5">
                  Category
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm ${
                      selectedCategory === 'all'
                        ? 'bg-[#128F92] text-white font-bold'
                        : 'text-[#0B4145] hover:bg-[#F0F9F8] font-semibold'
                    }`}
                  >
                    All Categories
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm ${
                        selectedCategory === cat.slug
                          ? 'bg-[#128F92] text-white font-bold'
                          : 'text-[#0B4145] hover:bg-[#F0F9F8] font-semibold'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#DDF3F2]">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#687F8D] mb-2.5">
                  Brand
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedBrand('all')}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm ${
                      selectedBrand === 'all'
                        ? 'bg-[#128F92] text-white font-bold'
                        : 'text-[#0B4145] hover:bg-[#F0F9F8] font-semibold'
                    }`}
                  >
                    All Brands
                  </button>
                  {BRANDS.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => setSelectedBrand(brand.slug)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm ${
                        selectedBrand === brand.slug
                          ? 'bg-[#128F92] text-white font-bold'
                          : 'text-[#0B4145] hover:bg-[#F0F9F8] font-semibold'
                      }`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#DDF3F2]">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-[#687F8D]">
                    Max Price
                  </h4>
                  <span className="text-sm font-extrabold text-[#0B4145]">
                    ₹{maxPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="6000"
                  step="200"
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

export default function CollectionsPage() {
  return (
    <Suspense fallback={<div className="max-w-[1520px] mx-auto px-4 py-16 text-center text-sm text-[#687F8D] font-bold">Loading collections...</div>}>
      <CollectionsContent />
    </Suspense>
  );
}