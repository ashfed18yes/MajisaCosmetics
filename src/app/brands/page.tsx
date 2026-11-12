import React from 'react';
import { getStorefrontBrands } from '@/lib/products';
import BrandsDirectoryClient from './BrandsDirectoryClient';

export const revalidate = 60;

export const metadata = {
  title: 'The Houses of Majisa | Curated Ateliers',
  description: 'Discover the premier cosmetic chemistry and botanical beauty houses curated by Majisa Cosmetics.',
};

export default async function BrandsPage() {
  const brands = await getStorefrontBrands();
  return <BrandsDirectoryClient initialBrands={brands} />;
}
