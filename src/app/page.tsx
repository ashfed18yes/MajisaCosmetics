import React from 'react';
import {
  getStorefrontProducts,
  getStorefrontCategories,
  getStorefrontBrands,
} from '@/lib/products';
import HomePageClient from './HomePageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [products, categories, brands] = await Promise.all([
    getStorefrontProducts(),
    getStorefrontCategories(),
    getStorefrontBrands(),
  ]);

  return (
    <HomePageClient
      products={products}
      categories={categories}
      brands={brands}
    />
  );
}
