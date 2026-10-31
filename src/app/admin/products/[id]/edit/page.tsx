import React from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import ProductFormClient from '../../ProductFormClient';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Edit Product | Majisa Admin',
  description: 'Update product information and catalog availability.',
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  await requireAdmin();
  const { id } = await params;
  const adminClient = createAdminClient();

  // Fetch product, brands, and categories concurrently
  const [
    { data: product, error: productError },
    { data: images },
    { data: variants },
    { data: brands },
    { data: categories },
  ] = await Promise.all([
    adminClient.from('products').select('*').eq('id', id).maybeSingle(),
    adminClient
      .from('product_images')
      .select('secure_url, public_id, width, height, alt_text, is_primary, display_order')
      .eq('product_id', id)
      .order('display_order', { ascending: true }),
    adminClient
      .from('product_variants')
      .select('variant_type, name, hex_code, price_override, is_available')
      .eq('product_id', id)
      .order('display_order', { ascending: true }),
    adminClient.from('brands').select('id, name').order('name', { ascending: true }),
    adminClient.from('categories').select('id, name').order('name', { ascending: true }),
  ]);

  if (productError || !product) {
    notFound();
  }

  const initialData = {
    name: product.name,
    basePrice: Number(product.base_price),
    originalPrice: product.original_price ? Number(product.original_price) : null,
    brandId: product.brand_id || null,
    categoryId: product.category_id || null,
    sku: product.sku || null,
    stockQuantity: product.stock_quantity !== null && product.stock_quantity !== undefined ? Number(product.stock_quantity) : null,
    description: product.description || '',
    howToUse: product.how_to_use || '',
    ingredients: product.ingredients || '',
    isAvailable: product.is_available,
    isBestseller: product.is_bestseller,
    isFeatured: product.is_featured,
    isNew: product.is_new,
    images: (images || []).map((img) => ({
      url: img.secure_url,
      publicId: img.public_id,
      width: img.width,
      height: img.height,
      altText: img.alt_text || '',
      isPrimary: img.is_primary,
    })),
    variants: (variants || []).map((v) => ({
      type: v.variant_type as 'shade' | 'size',
      name: v.name,
      hexCode: v.hex_code || undefined,
      priceOverride: v.price_override ? Number(v.price_override) : null,
      isAvailable: v.is_available,
    })),
  };

  return (
    <ProductFormClient
      mode="edit"
      productId={id}
      initialData={initialData}
      initialBrands={brands || []}
      initialCategories={categories || []}
    />
  );
}
