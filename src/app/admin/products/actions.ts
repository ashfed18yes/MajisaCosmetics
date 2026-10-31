'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  uploadProductImage,
  deleteCloudinaryProductImage,
  isCloudinaryConfigured,
} from '@/lib/cloudinary';

export interface ProductImageInput {
  url: string;
  publicId?: string;
  altText?: string;
  isPrimary?: boolean;
  width?: number | null;
  height?: number | null;
}

export interface ProductVariantInput {
  type: 'shade' | 'size';
  name: string;
  hexCode?: string;
  priceOverride?: number | null;
  isAvailable?: boolean;
}

export interface ProductFormData {
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
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Creates a new product with associated images and variants.
 */
export async function createProductAction(data: ProductFormData) {
  // 1. Verify administrative privileges server-side
  await requireAdmin();
  const adminClient = createAdminClient();

  // 2. Validate essential fields
  const trimmedName = data.name?.trim();
  if (!trimmedName) {
    return { success: false, error: 'Product name is required.' };
  }

  const basePrice = Number(data.basePrice);
  if (isNaN(basePrice) || basePrice < 0) {
    return { success: false, error: 'Selling price must be a valid non-negative number.' };
  }

  const originalPrice = data.originalPrice ? Number(data.originalPrice) : null;
  if (originalPrice !== null && (isNaN(originalPrice) || originalPrice < basePrice)) {
    return { success: false, error: 'MRP (Original Price) must be greater than or equal to selling price.' };
  }

  if (!data.images || data.images.length === 0 || !data.images.some((img) => img.url?.trim())) {
    return { success: false, error: 'At least one product image is required.' };
  }

  // Sanitize SKU: trim and convert empty or whitespace-only to null
  const sanitizedSku = data.sku && data.sku.trim() ? data.sku.trim() : null;

  // Sanitize Stock Quantity
  let sanitizedStock: number | null = null;
  if (data.stockQuantity !== undefined && data.stockQuantity !== null && String(data.stockQuantity).trim() !== '') {
    const parsedStock = Number(data.stockQuantity);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return { success: false, error: 'Stock quantity must be a non-negative number, or left empty.' };
    }
    sanitizedStock = Math.floor(parsedStock);
  }

  // 3. Generate a collision-resistant URL slug
  let slug = slugify(trimmedName);
  if (!slug) slug = 'product-' + Date.now();

  const { data: existingSlug } = await adminClient
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existingSlug) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
  }

  // 4. Insert into public.products
  const { data: insertedProduct, error: productError } = await adminClient
    .from('products')
    .insert({
      name: trimmedName,
      slug,
      base_price: basePrice,
      original_price: originalPrice,
      brand_id: data.brandId && data.brandId.trim() ? data.brandId : null,
      category_id: data.categoryId && data.categoryId.trim() ? data.categoryId : null,
      sku: sanitizedSku,
      stock_quantity: sanitizedStock,
      description: data.description?.trim() || '',
      how_to_use: data.howToUse?.trim() || null,
      ingredients: data.ingredients?.trim() || null,
      is_available: data.isAvailable ?? true,
      is_bestseller: data.isBestseller ?? false,
      is_featured: data.isFeatured ?? false,
      is_new: data.isNew ?? false,
    })
    .select('id')
    .single();

  if (productError || !insertedProduct) {
    if (productError?.code === '23505' && productError.message.includes('sku')) {
      return { success: false, error: `SKU "${sanitizedSku}" is already in use by another product.` };
    }
    return { success: false, error: productError?.message || 'Failed to create product record.' };
  }

  const productId = insertedProduct.id;

  // 5. Insert images
  const validImages = data.images.filter((img) => img.url?.trim());
  let hasPrimary = validImages.some((img) => img.isPrimary);

  const imagesToInsert = validImages.map((img, index) => {
    // If no image is marked primary, make the first image primary
    const isPrimary = hasPrimary ? !!img.isPrimary : index === 0;
    return {
      product_id: productId,
      secure_url: img.url.trim(),
      public_id: img.publicId?.trim() || `img_${productId.substring(0, 8)}_${index}_${Date.now()}`,
      alt_text: img.altText?.trim() || trimmedName,
      display_order: index,
      is_primary: isPrimary,
      width: img.width || null,
      height: img.height || null,
    };
  });

  // 5. Concurrently insert images and variants in parallel for maximum performance
  const [imagesInsertRes, variantsInsertRes] = await Promise.all([
    imagesToInsert.length > 0
      ? adminClient.from('product_images').insert(imagesToInsert)
      : Promise.resolve({ error: null }),
    data.variants && data.variants.length > 0
      ? (() => {
          const validVariants = data.variants
            .filter((v) => v.name?.trim())
            .map((v, index) => ({
              product_id: productId,
              variant_type: v.type,
              name: v.name.trim(),
              hex_code: v.hexCode?.trim() || null,
              price_override: v.priceOverride ? Number(v.priceOverride) : null,
              is_available: v.isAvailable ?? true,
              display_order: index,
            }));
          return validVariants.length > 0
            ? adminClient.from('product_variants').insert(validVariants)
            : Promise.resolve({ error: null });
        })()
      : Promise.resolve({ error: null }),
  ]);

  if (imagesInsertRes.error) {
    console.error('Failed to insert product images:', imagesInsertRes.error);
    // ATOMICITY: Clean up orphaned product if image insertion fails so no inconsistent records remain
    await adminClient.from('products').delete().eq('id', productId);
    return {
      success: false,
      error: `Failed to save product images: ${imagesInsertRes.error.message}`,
    };
  }

  if (variantsInsertRes.error) {
    console.error('Failed to insert product variants:', variantsInsertRes.error);
  }

  revalidatePath('/admin/products');
  revalidatePath('/collections');
  revalidatePath('/brands');
  revalidatePath('/');
  revalidatePath(`/products/${slug}`);

  return { success: true, productId };
}

/**
 * Updates an existing product, syncing its details, images, and variants.
 */
export async function updateProductAction(productId: string, data: ProductFormData) {
  // 1. Verify administrative privileges server-side
  await requireAdmin();
  const adminClient = createAdminClient();

  if (!productId) {
    return { success: false, error: 'Product ID is required for update.' };
  }

  const trimmedName = data.name?.trim();
  if (!trimmedName) {
    return { success: false, error: 'Product name cannot be empty.' };
  }

  const basePrice = Number(data.basePrice);
  if (isNaN(basePrice) || basePrice < 0) {
    return { success: false, error: 'Selling price must be a valid non-negative number.' };
  }

  const originalPrice = data.originalPrice ? Number(data.originalPrice) : null;
  if (originalPrice !== null && (isNaN(originalPrice) || originalPrice < basePrice)) {
    return { success: false, error: 'MRP (Original Price) must be greater than or equal to selling price.' };
  }

  if (!data.images || data.images.length === 0 || !data.images.some((img) => img.url?.trim())) {
    return { success: false, error: 'At least one product image is required.' };
  }

  const sanitizedSku = data.sku && data.sku.trim() ? data.sku.trim() : null;

  let sanitizedStock: number | null = null;
  if (data.stockQuantity !== undefined && data.stockQuantity !== null && String(data.stockQuantity).trim() !== '') {
    const parsedStock = Number(data.stockQuantity);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return { success: false, error: 'Stock quantity must be a non-negative number, or left empty.' };
    }
    sanitizedStock = Math.floor(parsedStock);
  }

  // 2. Update public.products
  const { error: updateError } = await adminClient
    .from('products')
    .update({
      name: trimmedName,
      base_price: basePrice,
      original_price: originalPrice,
      brand_id: data.brandId && data.brandId.trim() ? data.brandId : null,
      category_id: data.categoryId && data.categoryId.trim() ? data.categoryId : null,
      sku: sanitizedSku,
      stock_quantity: sanitizedStock,
      description: data.description?.trim() || '',
      how_to_use: data.howToUse?.trim() || null,
      ingredients: data.ingredients?.trim() || null,
      is_available: data.isAvailable ?? true,
      is_bestseller: data.isBestseller ?? false,
      is_featured: data.isFeatured ?? false,
      is_new: data.isNew ?? false,
    })
    .eq('id', productId);

  if (updateError) {
    if (updateError.code === '23505' && updateError.message.includes('sku')) {
      return { success: false, error: `SKU "${sanitizedSku}" is already in use by another product.` };
    }
    return { success: false, error: updateError.message };
  }

  // 3. Sync product images: Safely delete removed Cloudinary assets in parallel
  const { data: existingImages } = await adminClient
    .from('product_images')
    .select('public_id')
    .eq('product_id', productId);

  if (existingImages && existingImages.length > 0) {
    const retainedPublicIds = new Set(
      data.images.map((img) => img.publicId?.trim()).filter(Boolean)
    );
    const deletePromises = existingImages
      .filter(
        (oldImg) =>
          oldImg.public_id &&
          !retainedPublicIds.has(oldImg.public_id) &&
          oldImg.public_id.startsWith('majisa-cosmetics/products/')
      )
      .map((oldImg) => deleteCloudinaryProductImage(oldImg.public_id!));

    if (deletePromises.length > 0) {
      Promise.allSettled(deletePromises).catch((err) =>
        console.error('Error deleting removed Cloudinary images:', err)
      );
    }
  }

  // Concurrently clear old images and variants
  await Promise.all([
    adminClient.from('product_images').delete().eq('product_id', productId),
    adminClient.from('product_variants').delete().eq('product_id', productId),
  ]);

  // Concurrently insert updated images and variants in parallel
  const validImages = data.images.filter((img) => img.url?.trim());
  let hasPrimary = validImages.some((img) => img.isPrimary);

  const imagesToInsert = validImages.map((img, index) => {
    const isPrimary = hasPrimary ? !!img.isPrimary : index === 0;
    return {
      product_id: productId,
      secure_url: img.url.trim(),
      public_id: img.publicId?.trim() || `img_${productId.substring(0, 8)}_${index}_${Date.now()}`,
      alt_text: img.altText?.trim() || trimmedName,
      display_order: index,
      is_primary: isPrimary,
      width: img.width || null,
      height: img.height || null,
    };
  });

  const validVariants = (data.variants || [])
    .filter((v) => v.name?.trim())
    .map((v, index) => ({
      product_id: productId,
      variant_type: v.type,
      name: v.name.trim(),
      hex_code: v.hexCode?.trim() || null,
      price_override: v.priceOverride ? Number(v.priceOverride) : null,
      is_available: v.isAvailable ?? true,
      display_order: index,
    }));

  await Promise.all([
    imagesToInsert.length > 0
      ? adminClient.from('product_images').insert(imagesToInsert)
      : Promise.resolve({ error: null }),
    validVariants.length > 0
      ? adminClient.from('product_variants').insert(validVariants)
      : Promise.resolve({ error: null }),
  ]);

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath('/collections');
  revalidatePath('/brands');
  revalidatePath('/');

  return { success: true };
}

/**
 * Toggles product availability (In Storefront vs. Hidden).
 */
export async function toggleProductAvailabilityAction(productId: string, isAvailable: boolean) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('products')
    .update({ is_available: isAvailable })
    .eq('id', productId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/products');
  return { success: true };
}

/**
 * Deletes a product record and cleans up associated Cloudinary assets.
 */
export async function deleteProductAction(productId: string) {
  await requireAdmin();
  const adminClient = createAdminClient();

  // 1. Retrieve all Cloudinary public_ids associated with this product
  const { data: images } = await adminClient
    .from('product_images')
    .select('public_id')
    .eq('product_id', productId);

  // 2. Safely destroy Cloudinary assets
  if (images && images.length > 0) {
    for (const img of images) {
      if (img.public_id && img.public_id.startsWith('majisa-cosmetics/products/')) {
        await deleteCloudinaryProductImage(img.public_id);
      }
    }
  }

  // 3. Delete product (cascades to product_images and product_variants in database)
  const { error } = await adminClient
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/products');
  return { success: true };
}

/**
 * Securely uploads a product image to Cloudinary via server-side action.
 * Strictly verifies requireAdmin() and file constraints.
 */
export async function uploadProductImageAction(formData: FormData) {
  await requireAdmin();

  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      error:
        'Cloudinary credentials are not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local.',
    };
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return { success: false, error: 'No image file was provided.' };
  }

  // Enforce 5MB file size limit
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'File size exceeds the 5 MB limit.' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadProductImage(buffer, file.name);

    return {
      success: true,
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to upload image to Cloudinary.';
    return { success: false, error: message };
  }
}

/**
 * Quick-creates a brand directly from the product form without leaving the page.
 */
export async function quickCreateBrandAction(name: string) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const trimmedName = name?.trim();
  if (!trimmedName) {
    return { success: false, error: 'Brand name is required.' };
  }

  let slug = slugify(trimmedName);
  if (!slug) slug = 'brand-' + Date.now();

  const { data: existingBrand } = await adminClient
    .from('brands')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existingBrand) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const { data: brand, error } = await adminClient
    .from('brands')
    .insert({
      name: trimmedName,
      slug,
      tagline: '',
      description: '',
      logo_public_id: '',
      logo_url: '',
      banner_public_id: '',
      banner_url: '',
      is_active: true,
    })
    .select('id, name, slug')
    .single();

  if (error || !brand) {
    return { success: false, error: error?.message || 'Failed to create brand.' };
  }

  revalidatePath('/admin/products');
  return { success: true, brand };
}

/**
 * Quick-creates a category directly from the product form without leaving the page.
 */
export async function quickCreateCategoryAction(name: string) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const trimmedName = name?.trim();
  if (!trimmedName) {
    return { success: false, error: 'Category name is required.' };
  }

  let slug = slugify(trimmedName);
  if (!slug) slug = 'category-' + Date.now();

  const { data: existingCat } = await adminClient
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existingCat) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const { data: category, error } = await adminClient
    .from('categories')
    .insert({
      name: trimmedName,
      slug,
      tagline: '',
      description: '',
      image_public_id: '',
      image_url: '',
      is_active: true,
    })
    .select('id, name, slug')
    .single();

  if (error || !category) {
    return { success: false, error: error?.message || 'Failed to create category.' };
  }

  revalidatePath('/admin/products');
  return { success: true, category };
}

