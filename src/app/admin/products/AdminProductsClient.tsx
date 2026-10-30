'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Package,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import {
  toggleProductAvailabilityAction,
  deleteProductAction,
} from './actions';

export interface AdminProductItem {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  original_price: number | null;
  sku: string | null;
  stock_quantity: number | null;
  is_available: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  created_at: string;
  brand: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  primaryImage: string | null;
}

interface AdminProductsClientProps {
  initialProducts: AdminProductItem[];
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

export default function AdminProductsClient({
  initialProducts,
  brands,
  categories,
}: AdminProductsClientProps) {
  const [products, setProducts] = useState<AdminProductItem[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [productToDelete, setProductToDelete] = useState<AdminProductItem | null>(null);

  // Filter products based on search, brand, category, and status
  const filteredProducts = products.filter((p) => {
    // Search match
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const nameMatch = p.name.toLowerCase().includes(q);
      const skuMatch = p.sku ? p.sku.toLowerCase().includes(q) : false;
      if (!nameMatch && !skuMatch) return false;
    }

    // Brand filter
    if (selectedBrand === 'UNASSIGNED') {
      if (p.brand !== null) return false;
    } else if (selectedBrand !== 'ALL') {
      if (p.brand?.id !== selectedBrand) return false;
    }

    // Category filter
    if (selectedCategory === 'UNASSIGNED') {
      if (p.category !== null) return false;
    } else if (selectedCategory !== 'ALL') {
      if (p.category?.id !== selectedCategory) return false;
    }

    // Status filter
    if (statusFilter === 'ACTIVE') {
      if (!p.is_available) return false;
    } else if (statusFilter === 'INACTIVE') {
      if (p.is_available) return false;
    } else if (statusFilter === 'OUT_OF_STOCK') {
      if (p.stock_quantity !== 0) return false;
    } else if (statusFilter === 'IN_STOCK') {
      if (p.stock_quantity === 0) return false;
    }

    return true;
  });

  // Calculate summary counts
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.is_available).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length;
  const unassignedCount = products.filter((p) => !p.brand || !p.category).length;

  const handleToggleAvailability = (productId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_available: nextStatus } : p))
    );

    startTransition(async () => {
      const res = await toggleProductAvailabilityAction(productId, nextStatus);
      if (!res.success) {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, is_available: currentStatus } : p))
        );
        setActionMessage({ type: 'error', text: res.error || 'Failed to update visibility.' });
      } else {
        setActionMessage({
          type: 'success',
          text: `Product is now ${nextStatus ? 'visible' : 'hidden'} on the storefront.`,
        });
        setTimeout(() => setActionMessage(null), 3000);
      }
    });
  };

  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    const id = productToDelete.id;
    const name = productToDelete.name;

    startTransition(async () => {
      const res = await deleteProductAction(id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setProductToDelete(null);
        setActionMessage({ type: 'success', text: `"${name}" was deleted successfully.` });
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to delete product.' });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B4145]">
            Product Catalog
          </h1>
          <p className="text-sm text-[#5C5852] mt-0.5">
            Manage your store's products, pricing, availability, and classification.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#0B4145] text-white rounded-xl text-sm font-semibold hover:bg-[#083134] transition-all shadow-sm hover:shadow"
        >
          <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* KPI Cards / Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5E0D8] shadow-sm">
          <div className="text-xs font-medium text-[#7A7670] uppercase tracking-wider">Total Products</div>
          <div className="text-xl sm:text-2xl font-bold text-[#0B4145] mt-1">{totalCount}</div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5E0D8] shadow-sm">
          <div className="text-xs font-medium text-[#7A7670] uppercase tracking-wider">Active in Store</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">{activeCount}</div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5E0D8] shadow-sm">
          <div className="text-xs font-medium text-[#7A7670] uppercase tracking-wider">Out of Stock</div>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">{outOfStockCount}</div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5E0D8] shadow-sm">
          <div className="text-xs font-medium text-[#7A7670] uppercase tracking-wider">Unassigned</div>
          <div className="text-xl sm:text-2xl font-bold text-[#5C5852] mt-1">{unassignedCount}</div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center justify-between transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs underline ml-4 hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#9E9B95] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145] focus:border-[#0B4145]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145] text-[#2D2A26]"
            >
              <option value="ALL">All Brands</option>
              <option value="UNASSIGNED">Unassigned Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145] text-[#2D2A26]"
            >
              <option value="ALL">All Categories</option>
              <option value="UNASSIGNED">Unassigned Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145] text-[#2D2A26]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Visible in Store</option>
              <option value="INACTIVE">Hidden from Store</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Active Filters Clear Button if filtered */}
        {(searchTerm || selectedBrand !== 'ALL' || selectedCategory !== 'ALL' || statusFilter !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE4] text-xs text-[#7A7670]">
            <div>
              Showing <span className="font-semibold text-[#0B4145]">{filteredProducts.length}</span> of {products.length} products
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBrand('ALL');
                setSelectedCategory('ALL');
                setStatusFilter('ALL');
              }}
              className="text-[#0B4145] hover:underline font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#7A7670] mb-3">
              <Package className="w-7 h-7 stroke-1" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#0B4145]">
              {products.length === 0 ? 'No products in database yet' : 'No matching products found'}
            </h3>
            <p className="text-sm text-[#7A7670] max-w-md mx-auto mt-1 mb-5">
              {products.length === 0
                ? 'Your catalog is empty. Click below to add your first luxury product with a name, price, and image.'
                : 'Try adjusting your search terms or clearing your brand and category filters.'}
            </p>
            {products.length === 0 ? (
              <Link
                href="/admin/products/new"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#0B4145] text-white text-sm font-semibold rounded-xl hover:bg-[#083134] transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>Add Your First Product</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedBrand('ALL');
                  setSelectedCategory('ALL');
                  setStatusFilter('ALL');
                }}
                className="px-4 py-2 border border-[#D8D3C8] rounded-xl text-xs font-semibold text-[#0B4145] hover:bg-[#FBF9F5]"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E0D8] bg-[#FBF9F5] text-[11px] font-semibold text-[#7A7670] uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Product</th>
                  <th className="py-3.5 px-3">Brand</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Selling Price</th>
                  <th className="py-3.5 px-3">Stock</th>
                  <th className="py-3.5 px-3 text-center">Visibility</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4] text-sm">
                {filteredProducts.map((product) => {
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#FAF8F5] transition-colors group"
                    >
                      {/* Product Thumbnail + Name + SKU */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-12 h-12 rounded-lg bg-[#F0ECE4] overflow-hidden flex-shrink-0 border border-[#E5E0D8]">
                            {product.primaryImage ? (
                              <Image
                                src={product.primaryImage}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#9E9B95]">
                                <Package className="w-5 h-5 stroke-1" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="font-medium text-[#0B4145] hover:underline line-clamp-1 block text-sm"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center space-x-2 text-xs text-[#7A7670] mt-0.5">
                              {product.sku ? (
                                <span className="font-mono bg-gray-100 px-1.5 py-0.2 rounded text-[11px]">
                                  SKU: {product.sku}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px]">No SKU</span>
                              )}
                              {product.is_featured && (
                                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1 rounded">
                                  Featured
                                </span>
                              )}
                              {product.is_bestseller && (
                                <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-1 rounded">
                                  Bestseller
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3.5 px-3">
                        {product.brand ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#E8F1F0] text-[#0B4145]">
                            {product.brand.name}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs text-gray-500 bg-gray-100 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        {product.category ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5EFE0] text-[#785E2F]">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs text-gray-500 bg-gray-100 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-[#0B4145]">
                          ₹{product.base_price.toLocaleString('en-IN')}
                        </div>
                        {product.original_price && product.original_price > product.base_price && (
                          <div className="text-[11px] text-gray-400 line-through">
                            ₹{product.original_price.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-3">
                        {product.stock_quantity === null ? (
                          <span className="text-xs text-gray-500">Untracked</span>
                        ) : product.stock_quantity === 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-700">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="text-xs text-[#2D2A26] font-medium">
                            {product.stock_quantity} left
                          </span>
                        )}
                      </td>

                      {/* Visibility Switch */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(product.id, product.is_available)}
                          disabled={isPending}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            product.is_available
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={product.is_available ? 'Visible on storefront. Click to hide.' : 'Hidden from storefront. Click to make visible.'}
                        >
                          {product.is_available ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Live</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-1.5 rounded-lg text-[#0B4145] hover:bg-[#E8F1F0] transition-colors"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E0D8] space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-serif text-lg font-bold text-[#0B4145]">
                Delete Product?
              </h3>
              <p className="text-sm text-[#5C5852] mt-1">
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-[#0B4145]">"{productToDelete.name}"</span>?
                This will remove its images, variants, and details. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#D8D3C8] text-sm font-semibold text-[#5C5852] hover:bg-[#FBF9F5] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors shadow-sm"
              >
                {isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

