import React from 'react';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts, PRODUCTS } from '@/data/mockData';
import ProductDetailClient from './ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PRODUCTS.map((prod) => ({
    slug: prod.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found | Majisa Cosmetics' };

  return {
    title: `${product.name} | ${product.brand} | Majisa Cosmetics`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product.id, product.categorySlug, 4);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}

