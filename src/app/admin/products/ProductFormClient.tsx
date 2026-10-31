'use client';

import React, { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Loader2,
} from 'lucide-react';
import {
  createProductAction,
  updateProductAction,
  uploadProductImageAction,
  quickCreateBrandAction,
  quickCreateCategoryAction,
  ProductFormData,
  ProductImageInput,
  ProductVariantInput,
} from './actions';
import { compressProductImage } from '@/lib/imageCompression';

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

  // Brands and categories state
  const [brands, setBrands] = useState<BrandOption[]>(initialBrands);
  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories);

  // Form Fields - Basic Information
  const [name, setName] = useState(initialData?.name || '');
  const [basePrice, setBasePrice] = useState(
    initialData?.basePrice !== undefined ? String(initialData.basePrice) : ''
  );
  const [originalPrice, setOriginalPrice] = useState(
    initialData?.originalPrice ? String(initialData.originalPrice) : ''
  );
  const [brandId, setBrandId] = useState(initialData?.brandId || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');

  // Form Fields - Additional Details
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

  // Images state
  const [images, setImages] = useState<ProductImageInput[]>(
    initialData?.images && initialData.images.length > 0 ? initialData.images : []
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload queue for controlled parallel processing and per-image feedback
  interface UploadQueueItem {
    id: string;
    file: File;
    name: string;
    previewUrl: string;
    status: 'compressing' | 'uploading' | 'error';
    errorMessage?: string;
  }

  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [saveStage, setSaveStage] = useState<'idle' | 'uploading' | 'saving' | 'completed' | 'error'>('idle');
  const isSubmittingRef = useRef(false);

  // Variants state
  const [variants, setVariants] = useState<ProductVariantInput[]>(
    initialData?.variants || []
  );

  // UI state - Additional details collapsed by default
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick Add Modals
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState('');
  const [quickBrandError, setQuickBrandError] = useState<string | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const [quickCategoryError, setQuickCategoryError] = useState<string | null>(null);

  // Helpers for queue item state
  const updateQueueItem = (id: string, updates: Partial<UploadQueueItem>) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  /**
   * Processes a single image file: compresses on client, then uploads to Cloudinary via server action.
   */
  const uploadSingleItem = async (item: UploadQueueItem) => {
    try {
      updateQueueItem(item.id, { status: 'compressing', errorMessage: undefined });

      // 1. Client-side image compression & optimization
      const compressedFile = await compressProductImage(item.file, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.90,
      });

      // 2. Upload to Cloudinary
      updateQueueItem(item.id, { status: 'uploading' });
      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await uploadProductImageAction(formData);

      if (!res.success || !res.image) {
        updateQueueItem(item.id, {
          status: 'error',
          errorMessage: res.error || `Upload failed for ${item.name}`,
        });
        return;
      }

      // 3. Add to confirmed images
      setImages((prev) => {
        const isFirst = prev.length === 0;
        return [
          ...prev,
          {
            url: res.image!.url,
            publicId: res.image!.publicId,
            width: res.image!.width,
            height: res.image!.height,
            altText: name.trim() || item.name.replace(/\.[^/.]+$/, ''),
            isPrimary: isFirst,
          },
        ];
      });

      // 4. Clean up preview object URL and remove from queue
      URL.revokeObjectURL(item.previewUrl);
      setUploadQueue((prev) => prev.filter((q) => q.id !== item.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error uploading image.';
      updateQueueItem(item.id, { status: 'error', errorMessage: msg });
    }
  };

  /**
   * Processes items in parallel with controlled concurrency (up to 3 simultaneous uploads).
   */
  const processUploadQueue = async (items: UploadQueueItem[]) => {
    const queue = [...items];
    const concurrency = Math.min(3, queue.length);

    const worker = async () => {
      while (queue.length > 0) {
        const nextItem = queue.shift();
        if (!nextItem) break;
        await uploadSingleItem(nextItem);
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);
  };

  // Image handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 15 * 1024 * 1024; // Allow up to 15MB raw; compressed client-side before sending

    setErrorMessage(null);

    const fileList = Array.from(rawFiles);
    const validItems: UploadQueueItem[] = [];

    for (const file of fileList) {
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage(`"${file.name}" is not supported. Please upload a JPG, PNG, or WebP image.`);
        continue;
      }

      if (file.size > maxSizeBytes) {
        setErrorMessage(`"${file.name}" exceeds the 15 MB limit. Please choose a smaller image.`);
        continue;
      }

      validItems.push({
        id: `upl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        status: 'compressing',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (validItems.length === 0) return;

    setUploadQueue((prev) => [...prev, ...validItems]);
    await processUploadQueue(validItems);
  };

  const handleRetryItem = (itemId: string) => {
    const item = uploadQueue.find((q) => q.id === itemId);
    if (!item) return;
    uploadSingleItem(item);
  };

  const handleCancelQueueItem = (itemId: string) => {
    const item = uploadQueue.find((q) => q.id === itemId);
    if (item) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setUploadQueue((prev) => prev.filter((q) => q.id !== itemId));
  };

  const handleAddImage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedUrl = newImageUrl.trim();
    if (!trimmedUrl) return;

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setErrorMessage('Please enter a valid image URL starting with http:// or https://');
      return;
    }

    const isFirst = images.length === 0;
    setImages((prev) => [
      ...prev,
      {
        url: trimmedUrl,
        altText: name.trim() || 'Product photo',
        isPrimary: isFirst,
      },
    ]);

    setNewImageUrl('');
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
      setQuickBrandError('Please enter a brand name.');
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
      setQuickCategoryError('Please enter a category name.');
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

  // Variant helpers
  const handleAddShade = () => {
    setVariants((prev) => [
      ...prev,
      {
        type: 'shade',
        name: '',
        hexCode: '#C86D5C',
        isAvailable: true,
      },
    ]);
  };

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

  const isActivelyUploading = uploadQueue.some(
    (q) => q.status === 'compressing' || q.status === 'uploading'
  );

  const isSaveDisabled =
    isPending ||
    isActivelyUploading ||
    saveStage === 'saving' ||
    saveStage === 'completed';

  const renderSaveButtonContent = () => {
    if (isActivelyUploading) {
      const activeCount = uploadQueue.filter(
        (q) => q.status === 'compressing' || q.status === 'uploading'
      ).length;
      return (
        <span className="inline-flex items-center space-x-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Uploading {activeCount} Image{activeCount > 1 ? 's' : ''}...</span>
        </span>
      );
    }

    if (saveStage === 'saving' || isPending) {
      return (
        <span className="inline-flex items-center space-x-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Saving Product...</span>
        </span>
      );
    }

    if (saveStage === 'completed') {
      return (
        <span className="inline-flex items-center space-x-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-300" />
          <span>Completed!</span>
        </span>
      );
    }

    return <span>{mode === 'create' ? 'Save Product' : 'Save Changes'}</span>;
  };

  // Form Submit with duplicate submission locking & stage tracking
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isSubmittingRef.current || isPending) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (isActivelyUploading) {
      setErrorMessage('Please wait for image uploads to complete before saving.');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Product Name is required.');
      return;
    }

    const priceNum = Number(basePrice);
    if (!basePrice || isNaN(priceNum) || priceNum < 0) {
      setErrorMessage('Please enter a valid Selling Price.');
      return;
    }

    if (images.length === 0) {
      setErrorMessage('Please add at least one Product Image.');
      return;
    }

    isSubmittingRef.current = true;
    setSaveStage('saving');

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
      images,
      variants,
    };

    startTransition(async () => {
      try {
        let res;
        if (mode === 'create') {
          res = await createProductAction(payload);
        } else if (productId) {
          res = await updateProductAction(productId, payload);
        }

        if (res?.success) {
          setSaveStage('completed');
          setSuccessMessage(
            mode === 'create'
              ? 'Product saved successfully! Returning to catalog...'
              : 'Changes saved successfully! Returning to catalog...'
          );
          setTimeout(() => {
            router.push('/admin/products');
            router.refresh();
          }, 800);
        } else {
          isSubmittingRef.current = false;
          setSaveStage('error');
          setErrorMessage(
            res?.error || 'Unable to save product. Please check the details and try again.'
          );
        }
      } catch (err: unknown) {
        isSubmittingRef.current = false;
        setSaveStage('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred while saving.'
        );
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Title */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#7A7670] hover:text-[#0B4145] transition-colors mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Products</span>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-[#0B4145]">
            {mode === 'create' ? 'Add Product' : 'Edit Product'}
          </h1>
        </div>

        {/* Top Save Shortcut */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSaveDisabled}
          className="px-5 py-2 bg-[#0B4145] text-white rounded-xl text-sm font-semibold hover:bg-[#083134] transition-all shadow-sm disabled:opacity-50"
        >
          {renderSaveButtonContent()}
        </button>
      </div>

      {/* Inline Feedback Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* =========================================================================
            SECTION A: BASIC PRODUCT INFORMATION
        ========================================================================== */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E0D8] shadow-sm space-y-5">
          <h2 className="text-base font-bold text-[#0B4145]">
            Basic Information
          </h2>

          {/* 1. Product Name */}
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1.5">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Velvet Matte Lipstick"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145] text-[#2D2A26]"
            />
          </div>

          {/* 2. Selling Price & MRP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] mb-1.5">
                Selling Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 1450"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145] text-[#2D2A26]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2A26] mb-1.5">
                MRP (₹) <span className="text-xs font-normal text-gray-400">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 1800"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145] text-[#2D2A26]"
              />
            </div>
          </div>

          {/* 3. Brand & Category Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#2D2A26]">
                  Brand <span className="text-xs font-normal text-gray-400">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(true)}
                  className="text-xs font-semibold text-[#0B4145] hover:underline"
                >
                  + Add New
                </button>
              </div>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145] text-[#2D2A26]"
              >
                <option value="">None (Unassigned)</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#2D2A26]">
                  Category <span className="text-xs font-normal text-gray-400">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs font-semibold text-[#0B4145] hover:underline"
                >
                  + Add New
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145] text-[#2D2A26]"
              >
                <option value="">None (Unassigned)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Product Image (Required) */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1.5">
              Product Images <span className="text-rose-500">*</span>
            </label>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
            />

            {/* Upload Buttons & Options */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isActivelyUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#0B4145] text-white text-xs font-semibold rounded-xl hover:bg-[#083134] disabled:opacity-60 transition-colors shadow-sm"
                >
                  {isActivelyUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Cloudinary...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Images from Device</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-3 py-2 text-xs text-[#0B4145] hover:text-[#083134] font-medium hover:underline"
                >
                  {showUrlInput ? 'Hide URL input' : '+ Or paste image URL'}
                </button>
              </div>

              {/* URL Input (Optional / Fallback) */}
              {showUrlInput && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Paste image URL (https://...)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddImage()}
                    className="px-4 py-2 bg-stone-700 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors"
                  >
                    Add URL
                  </button>
                </div>
              )}

              <p className="text-[11px] text-[#7A7670]">
                Supports JPG, PNG, and WebP (up to 15 MB). Multi-image parallel uploads with automatic client compression.
              </p>
            </div>

            {/* Thumbnails Row: Confirmed Images + Active Upload Queue */}
            {images.length > 0 || uploadQueue.length > 0 ? (
              <div className="flex flex-wrap gap-3 mt-3">
                {/* 1. Confirmed Uploaded Images */}
                {images.map((img, idx) => (
                  <div
                    key={img.publicId || idx}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 bg-gray-50 flex-shrink-0 group ${
                      img.isPrimary ? 'border-[#0B4145] ring-2 ring-[#0B4145]/20' : 'border-[#E5E0D8]'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || 'Product photo'}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />

                    {/* Primary Badge */}
                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 bg-[#0B4145] text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm z-10">
                        Main
                      </span>
                    )}

                    {/* Overlay Action Buttons on Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1 z-20">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="p-1 bg-white rounded text-[#0B4145] hover:bg-gray-100 shadow-sm"
                          title="Set as Main Image"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 bg-white rounded text-rose-600 hover:bg-gray-100 shadow-sm"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. Upload Queue Items with Instant Preview & Progress */}
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 flex items-center justify-center ${
                      item.status === 'error'
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-[#128F92] bg-gray-100'
                    }`}
                  >
                    {/* Instant Local Preview */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover opacity-70"
                    />

                    {/* Progress / Status Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-1 text-center text-white">
                      {item.status === 'compressing' && (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white mb-0.5" />
                          <span className="text-[8px] font-bold uppercase tracking-wider">Optimizing</span>
                        </>
                      )}
                      {item.status === 'uploading' && (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#DDF3F2] mb-0.5" />
                          <span className="text-[8px] font-bold uppercase tracking-wider">Uploading</span>
                        </>
                      )}
                      {item.status === 'error' && (
                        <div className="flex flex-col items-center">
                          <AlertCircle className="w-4 h-4 text-rose-300 mb-0.5" />
                          <button
                            type="button"
                            onClick={() => handleRetryItem(item.id)}
                            className="text-[9px] font-bold underline bg-rose-800/90 px-1.5 py-0.5 rounded text-white hover:bg-rose-900"
                          >
                            Retry
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelQueueItem(item.id)}
                            className="absolute top-0.5 right-1 text-white/80 hover:text-white text-xs font-bold"
                            title="Cancel"
                          >
                            &times;
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-xs text-[#7A7670] mt-3 p-3 bg-[#FBF9F5] border border-dashed border-[#D8D3C8] rounded-xl">
                <ImageIcon className="w-4 h-4 stroke-1 text-[#7A7670]" />
                <span>At least one product image is required. Click &quot;Upload Images from Device&quot; to begin.</span>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            SECTION B: ADDITIONAL DETAILS (COLLAPSIBLE, OPTIONAL)
        ========================================================================== */}
        <div className="bg-white rounded-2xl border border-[#E5E0D8] shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors"
          >
            <div>
              <span className="text-sm font-bold text-[#0B4145]">
                Additional Details
              </span>
              <span className="text-xs text-[#7A7670] ml-2">
                (Optional: SKU, Stock, Description, Ingredients, Shades & Sizes)
              </span>
            </div>
            <div className="text-[#0B4145]">
              {isAdditionalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isAdditionalOpen && (
            <div className="p-6 sm:p-7 pt-2 border-t border-[#F0ECE4] space-y-4">
              {/* SKU & Stock Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
                    SKU (Item Code)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MAJ-LIP-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank for untracked stock"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145]"
                  />
                  <p className="text-[11px] text-[#7A7670] mt-0.5">
                    Blank = stock not tracked. 0 = out of stock.
                  </p>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Short description of the product benefits and texture..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145]"
                />
              </div>

              {/* How to Use & Ingredients */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
                    How to Use
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Application tips..."
                    value={howToUse}
                    onChange={(e) => setHowToUse(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
                    Ingredients
                  </label>
                  <textarea
                    rows={2}
                    placeholder="INCI ingredient list..."
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145]"
                  />
                </div>
              </div>

              {/* Variants: Shades & Sizes */}
              <div className="pt-2 border-t border-[#F0ECE4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2D2A26]">
                    Shades & Sizes
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleAddShade}
                      className="px-2.5 py-1 text-xs font-medium text-[#0B4145] bg-[#E8F1F0] rounded-lg hover:bg-[#d8e7e5]"
                    >
                      + Add Shade
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSize}
                      className="px-2.5 py-1 text-xs font-medium text-[#785E2F] bg-[#F5EFE0] rounded-lg hover:bg-[#ebdfc5]"
                    >
                      + Add Size
                    </button>
                  </div>
                </div>

                {variants.length > 0 ? (
                  <div className="space-y-2">
                    {variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 p-2 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]"
                      >
                        <span className="text-[11px] font-semibold text-[#7A7670] w-12 uppercase">
                          {v.type}
                        </span>
                        <input
                          type="text"
                          placeholder={v.type === 'shade' ? 'Shade name (e.g. Royal Red)' : 'Size (e.g. 50ml)'}
                          value={v.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                            );
                          }}
                          className="flex-1 px-2.5 py-1 text-xs bg-white border border-[#D8D3C8] rounded-lg"
                        />

                        {v.type === 'shade' && (
                          <div className="flex items-center space-x-1">
                            <input
                              type="color"
                              value={v.hexCode || '#C86D5C'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariants((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, hexCode: val } : item))
                                );
                              }}
                              className="w-6 h-6 rounded border border-gray-300 p-0 cursor-pointer"
                              title="Pick shade color"
                            />
                            <span className="text-[11px] font-mono text-gray-400">{v.hexCode}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No shades or sizes added.</p>
                )}
              </div>

              {/* Storefront Active Toggle */}
              <div className="pt-2 border-t border-[#F0ECE4]">
                <label className="flex items-center space-x-2 text-xs text-[#2D2A26] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded border-[#D8D3C8] text-[#0B4145] focus:ring-[#0B4145]"
                  />
                  <span>Active & Visible on Storefront</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 rounded-xl border border-[#D8D3C8] text-sm font-semibold text-[#5C5852] hover:bg-[#FBF9F5] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaveDisabled}
            className="px-6 py-2.5 bg-[#0B4145] text-white text-sm font-semibold rounded-xl hover:bg-[#083134] transition-all shadow-sm disabled:opacity-50"
          >
            {renderSaveButtonContent()}
          </button>
        </div>
      </form>

      {/* QUICK ADD BRAND MODAL */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-[#E5E0D8] space-y-3">
            <h3 className="font-serif text-lg font-bold text-[#0B4145]">
              Add Brand
            </h3>
            {quickBrandError && (
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-xs">
                {quickBrandError}
              </div>
            )}
            <input
              type="text"
              autoFocus
              placeholder="Brand name (e.g. Royal Paris)"
              value={quickBrandName}
              onChange={(e) => setQuickBrandName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145]"
            />
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsBrandModalOpen(false);
                  setQuickBrandError(null);
                }}
                className="px-3 py-1.5 text-xs text-[#7A7670] hover:text-[#2D2A26]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickCreateBrand}
                disabled={isPending}
                className="px-4 py-1.5 text-xs font-semibold bg-[#0B4145] text-white rounded-lg hover:bg-[#083134]"
              >
                {isPending ? 'Adding...' : 'Add Brand'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-[#E5E0D8] space-y-3">
            <h3 className="font-serif text-lg font-bold text-[#0B4145]">
              Add Category
            </h3>
            {quickCategoryError && (
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-xs">
                {quickCategoryError}
              </div>
            )}
            <input
              type="text"
              autoFocus
              placeholder="Category name (e.g. Lip Care)"
              value={quickCategoryName}
              onChange={(e) => setQuickCategoryName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D8D3C8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B4145]"
            />
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setQuickCategoryError(null);
                }}
                className="px-3 py-1.5 text-xs text-[#7A7670] hover:text-[#2D2A26]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickCreateCategory}
                disabled={isPending}
                className="px-4 py-1.5 text-xs font-semibold bg-[#0B4145] text-white rounded-lg hover:bg-[#083134]"
              >
                {isPending ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
