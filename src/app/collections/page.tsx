import React, { Suspense } from 'react';
import {
  getStorefrontProducts,
  getStorefrontCategories,
  getStorefrontBrands,
} from '@/lib/products';
import CollectionsClient from './CollectionsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'The Beauty Collections | Majisa Cosmetics',
  description: 'Explore our complete collection of botanical lipsticks, cellular hydration skincare, and artisanal fragrances.',
};

export default async function CollectionsPage() {
  const [products, categories, brands] = await Promise.all([
    getStorefrontProducts(),
    getStorefrontCategories(),
    getStorefrontBrands(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="max-w-[1420px] mx-auto px-4 py-20 text-center text-sm text-[#687F8D] font-bold">
          Loading curated collections...
        </div>
      }
    >
      <CollectionsClient
        initialProducts={products}
        categories={categories}
        brands={brands}
      />
    </Suspense>
  );
}
