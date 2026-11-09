import React from 'react';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminProductsClient from './AdminProductsClient';

export const metadata = {
  title: 'All Products | Majisa Admin',
  description: 'Manage your product catalog, prices, and stock.',
};

export default async function AdminProductsPage() {
  await requireAdmin();
  const adminClient = createAdminClient();

  // Concurrently fetch products, brands, and categories via Promise.all
  const [
    { data: rawProducts, error: productsError },
    { data: rawBrands },
    { data: rawCategories }
  ] = await Promise.all([
    adminClient
      .from('products')
      .select(`
        id,
        name,
        slug,
        base_price,
        original_price,
        sku,
        stock_quantity,
        is_available,
        is_featured,
        is_bestseller,
        created_at,
        brands ( id, name ),
        categories ( id, name ),
        product_images ( secure_url, is_primary, display_order )
      `)
      .order('created_at', { ascending: false }),
    adminClient
      .from('brands')
      .select('id, name')
      .order('name', { ascending: true }),
    adminClient
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true }),
  ]);

  if (productsError) {
    console.error('Error fetching admin products:', productsError);
  }

  // 4. Transform data into normalized clean format
  const products = (rawProducts || []).map((p: any) => {
    // Determine primary image
    const images = Array.isArray(p.product_images) ? p.product_images : [];
    const primaryImgObj = images.find((img: any) => img.is_primary) || images[0];

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      base_price: Number(p.base_price),
      original_price: p.original_price ? Number(p.original_price) : null,
      sku: p.sku || null,
      stock_quantity: p.stock_quantity !== null && p.stock_quantity !== undefined ? Number(p.stock_quantity) : null,
      is_available: p.is_available,
      is_featured: p.is_featured,
      is_bestseller: p.is_bestseller,
      created_at: p.created_at,
      brand: p.brands ? { id: p.brands.id, name: p.brands.name } : null,
      category: p.categories ? { id: p.categories.id, name: p.categories.name } : null,
      primaryImage: primaryImgObj?.secure_url || null,
    };
  });

  return (
    <AdminProductsClient
      initialProducts={products}
      brands={rawBrands || []}
      categories={rawCategories || []}
    />
  );
}

