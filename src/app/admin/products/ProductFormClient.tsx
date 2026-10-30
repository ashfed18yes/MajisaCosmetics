'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  AlertCircle,
  CheckCircle2,
  Palette,
  Package,
} from 'lucide-react';
import {
  createProductAction,
  updateProductAction,
  quickCreateBrandAction,
  quickCreateCategoryAction,
  ProductFormData,
  ProductImageInput,
  ProductVariantInput,
} from './actions';

interface BrandOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFormClientProps {
  mode: 'create' | 'edit';
  productId?: string;
  initialData?: {
    name: string;
    basePrice: number;
    originalPrice?: number | null;
    brandId?: string | null;
    categoryId?: string | null;
    sku?: string | null;
    stockQuantity?: number | null;
    description?: string;
    howToUse?: string;
    ingredients?: string;
    isAvailable?: boolean;
    isBestseller?: boolean;
    isFeatured?: boolean;
    isNew?: boolean;
    images: ProductImageInput[];
    variants?: ProductVariantInput[];
  };
  initialBrands: BrandOption[];
  initialCategories: CategoryOption[];
}

export default function ProductFormClient({
  mode,
  productId,
  initialData,
  initialBrands,
  initialCategories,
}: ProductFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Brands and categories state (with dynamic additions)
  const [brands, setBrands] = useState<BrandOption[]>(initialBrands);
  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories);

  // Form Fields
  const [name, setName] = useState(initialData?.name || '');
  const [basePrice, setBasePrice] = useState(initialData?.basePrice ? String(initialData.basePrice) : '');
  const [originalPrice, setOriginalPrice] = useState(
    initialData?.originalPrice ? String(initialData.originalPrice) : ''
  );
  const [brandId, setBrandId] = useState(initialData?.brandId || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [stockQuantity, setStockQuantity] = useState(
    initialData?.stockQuantity !== null && initialData?.stockQuantity !== undefined
      ? String(initialData.stockQuantity)
      : ''
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [howToUse, setHowToUse] = useState(initialData?.howToUse || '');
  const [ingredients, setIngredients] = useState(initialData?.ingredients || '');
  const [isAvailable, setIsAvailable] = useState(initialData?.isAvailable ?? true);
  const [isBestseller, setIsBestseller] = useState(initialData?.isBestseller ?? false);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [isNew, setIsNew] = useState(initialData?.isNew ?? false);

  // Images state
  const [images, setImages] = useState<ProductImageInput[]>(
    initialData?.images && initialData.images.length > 0
      ? initialData.images
      : []
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');

  // Variants state
  const [variants, setVariants] = useState<ProductVariantInput[]>(
    initialData?.variants || []
  );

  // UI state
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick modals state
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState('');
  const [quickBrandError, setQuickBrandError] = useState<string | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const [quickCategoryError, setQuickCategoryError] = useState<string | null>(null);

  // Image actions
  const handleAddImage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedUrl = newImageUrl.trim();
    if (!trimmedUrl) return;

    // Check basic URL format
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setErrorMessage('Please enter a valid HTTP or HTTPS image URL.');
      return;
    }

    const isFirst = images.length === 0;
    setImages((prev) => [
      ...prev,
      {
        url: trimmedUrl,
        altText: newImageAlt.trim() || name.trim() || 'Product image',
        isPrimary: isFirst,
      },
    ]);

    setNewImageUrl('');
    setNewImageAlt('');
    setErrorMessage(null);
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // If we removed the primary image, mark the first remaining one as primary
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  // Quick Brand Creation
  const handleQuickCreateBrand = () => {
    const trimmed = quickBrandName.trim();
    if (!trimmed) {
      setQuickBrandError('Brand name is required.');
      return;
    }

    startTransition(async () => {
      const res = await quickCreateBrandAction(trimmed);
      if (res.success && res.brand) {
        setBrands((prev) => [...prev, { id: res.brand.id, name: res.brand.name }]);
        setBrandId(res.brand.id);
        setQuickBrandName('');
        setIsBrandModalOpen(false);
        setQuickBrandError(null);
      } else {
        setQuickBrandError(res.error || 'Failed to create brand.');
      }
    });
  };

  // Quick Category Creation
  const handleQuickCreateCategory = () => {
    const trimmed = quickCategoryName.trim();
    if (!trimmed) {
      setQuickCategoryError('Category name is required.');
      return;
    }

    startTransition(async () => {
      const res = await quickCreateCategoryAction(trimmed);
      if (res.success && res.category) {
        setCategories((prev) => [...prev, { id: res.category.id, name: res.category.name }]);
        setCategoryId(res.category.id);
        setQuickCategoryName('');
        setIsCategoryModalOpen(false);
        setQuickCategoryError(null);
      } else {
        setQuickCategoryError(res.error || 'Failed to create category.');
      }
    });
  };

  // Add Shade Variant
  const handleAddShade = () => {
    setVariants((prev) => [
      ...prev,
      {
        type: 'shade',
        name: '',
        hexCode: '#BC7D6E',
        isAvailable: true,
      },
    ]);
  };

  // Add Size/Volume Variant
  const handleAddSize = () => {
    setVariants((prev) => [
      ...prev,
      {
        type: 'size',
        name: '',
        priceOverride: null,
        isAvailable: true,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a product name.');
      return;
    }

    const priceNum = Number(basePrice);
    if (!basePrice || isNaN(priceNum) || priceNum < 0) {
      setErrorMessage('Please enter a valid non-negative selling price.');
      return;
    }

    if (images.length === 0) {
      setErrorMessage('Please add at least one product image.');
      return;
    }

    const payload: ProductFormData = {
      name: trimmedName,
      basePrice: priceNum,
      originalPrice: originalPrice ? Number(originalPrice) : null,
      brandId: brandId || null,
      categoryId: categoryId || null,
      sku: sku.trim() || null,
      stockQuantity: stockQuantity.trim() !== '' ? Number(stockQuantity) : null,
      description: description.trim(),
      howToUse: howToUse.trim() || undefined,
      ingredients: ingredients.trim() || undefined,
      isAvailable,
      isBestseller,
      isFeatured,
      isNew,
      images,
      variants,
    };

    startTransition(async () => {
      let res;
      if (mode === 'create') {
        res = await createProductAction(payload);
      } else if (productId) {
        res = await updateProductAction(productId, payload);
      }

      if (res?.success) {
        setSuccessMessage(
          mode === 'create'
            ? 'Product created successfully! Redirecting to catalog...'
            : 'Product updated successfully! Redirecting to catalog...'
        );
        setTimeout(() => {
          router.push('/admin/products');
          router.refresh();
        }, 1200);
      } else {
        setErrorMessage(res?.error || 'Failed to save product. Please check your inputs.');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link & Title */}
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#0B4145] hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Products</span>
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B4145]">
          {mode === 'create' ? 'Add New Product' : `Edit "${name || 'Product'}"`}
        </h1>
        <p className="text-sm text-[#5C5852] mt-0.5">
          {mode === 'create'
            ? 'Fill in the basic product details below. Required fields are marked with an asterisk.'
            : 'Update product information, pricing, stock, or associated images.'}
        </p>
      </div>

      {/* Error / Success Feedback */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Action blocked: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="font-medium">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CARD 1: ESSENTIAL DETAILS */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D8] shadow-sm space-y-5">
          <h2 className="font-serif text-lg font-bold text-[#0B4145] border-b border-[#F0ECE4] pb-3">
            1. Essential Details
          </h2>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-1.5">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Heritage Velvet Matte Lipstick"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4145] focus:border-[#0B4145] text-[#2D2A26]"
            />
          </div>

          {/* Pricing Row: Selling Price + MRP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Selling Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 1850"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4145] text-[#2D2A26]"
              />
              <p className="text-[11px] text-[#7A7670] mt-1">The price the customer will pay.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                MRP / Original Price (₹) <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 2200"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4145] text-[#2D2A26]"
              />
              <p className="text-[11px] text-[#7A7670] mt-1">Shown struck-through to highlight a discount.</p>
            </div>
          </div>

          {/* Classification: Brand + Category (with Inline Quick Add) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Brand Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider">
                  Brand <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(true)}
                  className="text-xs font-semibold text-[#0B4145] hover:text-[#D4AF37] flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Brand</span>
                </button>
              </div>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4145] text-[#2D2A26]"
              >
                <option value="">— Unassigned Brand —</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#7A7670] mt-1">
                Associates this product with its brand page automatically.
              </p>
            </div>

            {/* Category Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider">
                  Category <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs font-semibold text-[#0B4145] hover:text-[#D4AF37] flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Category</span>
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4145] text-[#2D2A26]"
              >
                <option value="">— Unassigned Category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#7A7670] mt-1">
                Associates this product with its category collection automatically.
              </p>
            </div>
          </div>
        </div>

        {/* CARD 2: PRODUCT IMAGES */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D8] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#F0ECE4] pb-3 gap-2">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#0B4145]">
                2. Product Images <span className="text-rose-500">*</span>
              </h2>
              <p className="text-xs text-[#7A7670]">
                Add one or more photos. At least one image is required.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0B4145] bg-[#E8F1F0] px-2.5 py-1 rounded-full w-fit">
              {images.length} {images.length === 1 ? 'image added' : 'images added'}
            </span>
          </div>

          {/* Cloudinary Integration Status Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">Direct Image URL Mode:</span> Paste image URLs below (e.g. Unsplash, CDN, or Cloudinary URLs). Full automated drag-and-drop Cloudinary uploading will activate once Cloudinary API credentials are provided in your environment.
            </div>
          </div>

          {/* Add Image URL Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="Paste public image URL (https://...)"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4145]"
            />
            <button
              type="button"
              onClick={() => handleAddImage()}
              className="px-4 py-2 bg-[#0B4145] text-white rounded-xl text-xs font-semibold hover:bg-[#083134] transition-colors flex items-center justify-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Add Image</span>
            </button>
          </div>

          {/* Images Grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-xl border-2 overflow-hidden bg-[#FAF8F5] transition-all group ${
                    img.isPrimary ? 'border-[#0B4145] ring-2 ring-[#0B4145]/20' : 'border-[#E5E0D8]'
                  }`}
                >
                  <div className="relative aspect-square w-full">
                    <Image
                      src={img.url}
                      alt={img.altText || 'Product preview'}
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  </div>

                  {/* Badges and Actions overlay */}
                  <div className="p-2 bg-white flex items-center justify-between border-t border-[#E5E0D8] text-xs">
                    {img.isPrimary ? (
                      <span className="font-semibold text-emerald-700 flex items-center space-x-0.5 text-[11px]">
                        <Check className="w-3 h-3" />
                        <span>Primary</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        className="text-[11px] text-[#0B4145] hover:underline font-medium"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center border-2 border-dashed border-[#D8D3C8] rounded-xl bg-[#FAF8F5]">
              <ImageIcon className="w-8 h-8 text-[#9E9B95] mx-auto mb-1 stroke-1" />
              <div className="text-xs text-[#7A7670]">
                No images added yet. Paste an image URL above and click "Add Image".
              </div>
            </div>
          )}
        </div>

        {/* CARD 3: COLLAPSIBLE ADDITIONAL DETAILS (OPTIONAL) */}
        <div className="bg-white rounded-2xl border border-[#E5E0D8] shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-[#FAF8F5] transition-colors"
          >
            <div>
              <h2 className="font-serif text-lg font-bold text-[#0B4145]">
                3. Additional Details & Cosmetics Options
              </h2>
              <p className="text-xs text-[#7A7670] mt-0.5">
                SKU, stock inventory, cosmetic shades, ingredients, and storefront badges.
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[#F0ECE4] text-[#0B4145]">
              {isAdditionalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isAdditionalOpen && (
            <div className="p-6 pt-2 border-t border-[#F0ECE4] space-y-5">
              {/* SKU & Stock Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MAJ-LIP-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4145] font-mono text-[#2D2A26]"
                  />
                  <p className="text-[11px] text-[#7A7670] mt-1">Unique item barcode/identifier.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank for untracked / unlimited"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4145] text-[#2D2A26]"
                  />
                  <p className="text-[11px] text-[#7A7670] mt-1">
                    Empty = stock tracking disabled. 0 = Out of stock.
                  </p>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the product formula, finish, and benefits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4145] text-[#2D2A26]"
                />
              </div>

              {/* Cosmetics Details: How to Use & Ingredients */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    How to Use
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Application tips..."
                    value={howToUse}
                    onChange={(e) => setHowToUse(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4145] text-[#2D2A26]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                    Ingredients
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Full INCI formula list..."
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4145] text-[#2D2A26]"
                  />
                </div>
              </div>

              {/* Product Variants (Shades & Sizes) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-2">
                  <div className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider">
                    Product Variants (Shades & Sizes)
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleAddShade}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#E8F1F0] text-[#0B4145] rounded-lg hover:bg-[#d8e7e5] transition-colors flex items-center space-x-1"
                    >
                      <Palette className="w-3 h-3" />
                      <span>+ Add Shade</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSize}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#F5EFE0] text-[#785E2F] rounded-lg hover:bg-[#ebdfc5] transition-colors flex items-center space-x-1"
                    >
                      <Package className="w-3 h-3" />
                      <span>+ Add Size</span>
                    </button>
                  </div>
                </div>

                {variants.length > 0 ? (
                  <div className="space-y-2">
                    {variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]"
                      >
                        <span className="text-xs uppercase font-bold text-[#7A7670] w-14">
                          {v.type === 'shade' ? 'Shade' : 'Size'}
                        </span>
                        <input
                          type="text"
                          placeholder={v.type === 'shade' ? 'Shade name (e.g. Royal Crimson)' : 'Size (e.g. 50ml)'}
                          value={v.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                            );
                          }}
                          className="flex-1 min-w-[140px] px-2.5 py-1.5 text-xs bg-white border border-[#D8D3C8] rounded-lg"
                        />

                        {v.type === 'shade' && (
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="color"
                              value={v.hexCode || '#BC7D6E'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariants((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, hexCode: val } : item))
                                );
                              }}
                              className="w-7 h-7 rounded border border-gray-300 p-0 cursor-pointer"
                              title="Pick shade color"
                            />
                            <span className="text-[11px] font-mono text-gray-500">{v.hexCode}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          title="Remove variant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No variants added for this product.</p>
                )}
              </div>

              {/* Storefront Badges & Visibility */}
              <div className="pt-2 border-t border-[#F0ECE4]">
                <div className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-2">
                  Storefront Visibility & Curations
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center space-x-2 text-xs text-[#2D2A26] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="rounded border-[#D8D3C8] text-[#0B4145] focus:ring-[#0B4145]"
                    />
                    <span>Visible in Store</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-[#2D2A26] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded border-[#D8D3C8] text-[#0B4145] focus:ring-[#0B4145]"
                    />
                    <span>Featured Product</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-[#2D2A26] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBestseller}
                      onChange={(e) => setIsBestseller(e.target.checked)}
                      className="rounded border-[#D8D3C8] text-[#0B4145] focus:ring-[#0B4145]"
                    />
                    <span>Bestseller</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-[#2D2A26] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNew}
                      onChange={(e) => setIsNew(e.target.checked)}
                      className="rounded border-[#D8D3C8] text-[#0B4145] focus:ring-[#0B4145]"
                    />
                    <span>New Arrival</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FORM ACTIONS */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 rounded-xl border border-[#D8D3C8] text-sm font-semibold text-[#5C5852] hover:bg-[#FBF9F5] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-7 py-2.5 rounded-xl bg-[#0B4145] text-white text-sm font-semibold hover:bg-[#083134] transition-all shadow-sm hover:shadow disabled:opacity-50 flex items-center space-x-2"
          >
            {isPending ? (
              <span>Saving Product...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>{mode === 'create' ? 'Save and Publish Product' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* QUICK CREATE BRAND MODAL */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-[#E5E0D8] space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#0B4145]">
              Quick Add Brand
            </h3>
            <p className="text-xs text-[#5C5852]">
              Create a new brand instantly. It will be added to the database and automatically selected.
            </p>

            {quickBrandError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs">
                {quickBrandError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
                Brand Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Paris Royale"
                value={quickBrandName}
                onChange={(e) => setQuickBrandName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsBrandModalOpen(false);
                  setQuickBrandError(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#5C5852] hover:bg-[#FBF9F5] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickCreateBrand}
                disabled={isPending}
                className="px-4 py-1.5 text-xs font-semibold bg-[#0B4145] text-white rounded-lg hover:bg-[#083134]"
              >
                {isPending ? 'Saving...' : 'Add Brand'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CREATE CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-[#E5E0D8] space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#0B4145]">
              Quick Add Category
            </h3>
            <p className="text-xs text-[#5C5852]">
              Create a new collection category instantly and associate it with this product.
            </p>

            {quickCategoryError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs">
                {quickCategoryError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
                Category Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Nail Lacquers"
                value={quickCategoryName}
                onChange={(e) => setQuickCategoryName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setQuickCategoryError(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#5C5852] hover:bg-[#FBF9F5] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickCreateCategory}
                disabled={isPending}
                className="px-4 py-1.5 text-xs font-semibold bg-[#0B4145] text-white rounded-lg hover:bg-[#083134]"
              >
                {isPending ? 'Saving...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

