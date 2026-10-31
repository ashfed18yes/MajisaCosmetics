import React from 'react';
import { notFound } from 'next/navigation';
import { getStorefrontProductBySlug, getStorefrontRelatedProducts } from '@/lib/products';
import ProductDetailClient from './ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  if (!product) return { title: 'Product Not Found | Majisa Cosmetics' };

  return {
    title: `${product.name} | ${product.brand} | Majisa Cosmetics`,
    description: product.description || `${product.name} by ${product.brand}. Handcrafted luxury cosmetics.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getStorefrontRelatedProducts(product.id, product.categorySlug, 4);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
