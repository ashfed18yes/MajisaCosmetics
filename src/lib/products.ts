import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { Product, Category, Brand, ProductVariant, ProductSize } from '@/types';
import {
  CATEGORIES as MOCK_CATEGORIES,
} from '@/data/mockData';

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop';
const DEFAULT_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1000&auto=format&fit=crop';
const DEFAULT_BRAND_LOGO =
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300&auto=format&fit=crop';
const DEFAULT_BRAND_BANNER =
  'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=1600&auto=format&fit=crop';

/**
 * Fallback images mapped by category slug/keyword to ensure every category displays
 * a tailored, high-quality, category-specific visual representation.
 */
const CATEGORY_IMAGE_FALLBACKS: Record<string, string> = {
  facewash: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1000&auto=format&fit=crop',
  lipstick: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=1000&auto=format&fit=crop',
  lipsticks: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?q=80&w=1000&auto=format&fit=crop',
  'lip-care': 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=1000&auto=format&fit=crop',
  haircare: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=1000&auto=format&fit=crop',
  skincare: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&auto=format&fit=crop',
  'face-makeup': 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=1000&auto=format&fit=crop',
  'eye-makeup': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1000&auto=format&fit=crop',
  sunscreen: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1000&auto=format&fit=crop',
  fragrances: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000&auto=format&fit=crop',
  'all-makeup': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=1000&auto=format&fit=crop',
  makeup: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=1000&auto=format&fit=crop',
};

function getCategoryFallbackImage(slug?: string, name?: string): string {
  const s = slug?.toLowerCase().trim() || '';
  if (CATEGORY_IMAGE_FALLBACKS[s]) return CATEGORY_IMAGE_FALLBACKS[s];
  const n = name?.toLowerCase().trim() || '';
  for (const [key, url] of Object.entries(CATEGORY_IMAGE_FALLBACKS)) {
    if (n.includes(key) || key.includes(n)) return url;
  }
  return DEFAULT_CATEGORY_IMAGE;
}

/**
 * Transforms a raw Supabase product row (with joins) into the frontend `Product` interface.
 */
function mapSupabaseProduct(p: any): Product {
  const rawImages = Array.isArray(p.product_images) ? [...p.product_images] : [];
  rawImages.sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.display_order || 0) - (b.display_order || 0);
  });

  const images = rawImages
    .map((img) => img.secure_url)
    .filter((url): url is string => Boolean(url && url.trim()));

  const variants: any[] = Array.isArray(p.product_variants) ? p.product_variants : [];
  const shades: ProductVariant[] = variants
    .filter((v: any) => v.variant_type === 'shade' && v.name?.trim())
    .map((v: any) => ({
      id: v.id,
      name: v.name.trim(),
      hex: v.hex_code?.trim() || undefined,
      inStock: v.is_available ?? true,
    }));

  const sizes: ProductSize[] = variants
    .filter((v: any) => v.variant_type === 'size' && v.name?.trim())
    .map((v: any) => ({
      id: v.id,
      size: v.name.trim(),
      inStock: v.is_available ?? true,
    }));

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brands?.name || 'Majisa Signature',
    brandSlug: p.brands?.slug || 'majisa',
    category: p.categories?.name || 'General',
    categorySlug: p.categories?.slug || 'all',
    price: Number(p.base_price),
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    rating: Number(p.rating || 5.0),
    reviewCount: Number(p.review_count || 0),
    description: p.description || '',
    details: Array.isArray(p.details) ? p.details : [],
    howToUse: p.how_to_use || undefined,
    ingredients: p.ingredients || undefined,
    images: images.length > 0 ? images : [DEFAULT_PRODUCT_IMAGE],
    isAvailable: p.is_available ?? true,
    isBestseller: Boolean(p.is_bestseller),
    isNew: Boolean(p.is_new),
    isFeatured: Boolean(p.is_featured),
    shades: shades.length > 0 ? shades : undefined,
    sizes: sizes.length > 0 ? sizes : undefined,
  };
}

/**
 * Transforms a raw Supabase category row into the frontend `Category` interface.
 */
function mapSupabaseCategory(c: any): Category {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline || 'Botanical Luxury Formulation',
    description: c.description || 'Curated luxury cosmetic formulations handcrafted with the finest botanical ingredients.',
    image: c.image_url?.trim() || getCategoryFallbackImage(c.slug, c.name),
    featuredInNav: c.featured_in_nav ?? true,
  };
}

/**
 * Automatically selects a representative product image for a brand card.
 * Priority:
 * 1. Available products belonging to the brand with an is_primary = true image.
 * 2. Available products with the first available product image.
 * 3. Any brand product image.
 * 4. Explicit brand banner_url / logo_url.
 * 5. Neutral beauty fallback (DEFAULT_BRAND_BANNER).
 */
function selectBrandCoverImage(b: any): string {
  if (Array.isArray(b.products) && b.products.length > 0) {
    const availableProducts = b.products.filter((p: any) => p.is_available ?? true);
    const candidateProducts = availableProducts.length > 0 ? availableProducts : b.products;

    const allImages: Array<{ secure_url: string; is_primary?: boolean; display_order?: number }> = [];
    for (const p of candidateProducts) {
      if (Array.isArray(p.product_images)) {
        for (const img of p.product_images) {
          if (img.secure_url && img.secure_url.trim()) {
            allImages.push(img);
          }
        }
      }
    }

    if (allImages.length > 0) {
      allImages.sort((x, y) => {
        if (x.is_primary && !y.is_primary) return -1;
        if (!x.is_primary && y.is_primary) return 1;
        return (x.display_order || 0) - (y.display_order || 0);
      });
      return allImages[0].secure_url.trim();
    }
  }

  if (b.banner_url?.trim()) return b.banner_url.trim();
  if (b.logo_url?.trim()) return b.logo_url.trim();

  return DEFAULT_BRAND_BANNER;
}

/**
 * Transforms a raw Supabase brand row (with nested products and images) into the frontend `Brand` interface.
 */
function mapSupabaseBrand(b: any): Brand {
  const coverImage = selectBrandCoverImage(b);
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    tagline: b.tagline || 'Plant-Based Active Formulations',
    description: b.description || 'Clean, plant-powered active formulations delivering targeted wellness and beauty results.',
    logo: b.logo_url?.trim() || coverImage,
    banner: coverImage,
    origin: b.origin || undefined,
    founded: b.founded_year || undefined,
  };
}

/**
 * Fetches all available products exclusively from Supabase.
 * Returns only real database products; returns empty array if none exist or on error.
 */
export const getStorefrontProducts = cache(async (): Promise<Product[]> => {
  try {
    const supabase = createPublicClient();
    const { data: rawProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        brands ( id, name, slug ),
        categories ( id, name, slug ),
        product_images ( secure_url, is_primary, display_order ),
        product_variants ( id, variant_type, name, hex_code, is_available )
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Supabase storefront products:', error);
      return [];
    }

    const liveProducts = (rawProducts || []).map(mapSupabaseProduct);
    return liveProducts;
  } catch (err) {
    console.error('Unexpected error in getStorefrontProducts:', err);
    return [];
  }
});

/**
 * Retrieves a single product by its URL slug directly from Supabase.
 * Returns null if not found or on error (no mock fallback).
 */
export const getStorefrontProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (!slug) return null;

  try {
    const supabase = createPublicClient();
    const { data: rawProduct, error } = await supabase
      .from('products')
      .select(`
        *,
        brands ( id, name, slug ),
        categories ( id, name, slug ),
        product_images ( secure_url, is_primary, display_order ),
        product_variants ( id, variant_type, name, hex_code, is_available )
      `)
      .eq('slug', slug)
      .eq('is_available', true)
      .maybeSingle();

    if (!error && rawProduct) {
      return mapSupabaseProduct(rawProduct);
    }

    return null;
  } catch (err) {
    console.error('Error fetching product by slug:', slug, err);
    return null;
  }
});

/**
 * Fetches all categories from Supabase merged with mock categories.
 * Memoized per-request with React cache().
 */
export const getStorefrontCategories = cache(async (): Promise<Category[]> => {
  try {
    const supabase = createPublicClient();
    const { data: rawCats, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !rawCats || rawCats.length === 0) {
      return MOCK_CATEGORIES;
    }

    const liveCats = rawCats.map(mapSupabaseCategory);
    const liveSlugs = new Set(liveCats.map((c) => c.slug.toLowerCase()));
    const liveNames = new Set(liveCats.map((c) => c.name.toLowerCase()));
    const nonConflictingMock = MOCK_CATEGORIES.filter(
      (m) => !liveSlugs.has(m.slug.toLowerCase()) && !liveNames.has(m.name.toLowerCase())
    );

    return [...liveCats, ...nonConflictingMock];
  } catch (err) {
    console.error('Error in getStorefrontCategories:', err);
    return MOCK_CATEGORIES;
  }
});

/**
 * Retrieves a category by slug from Supabase or fallback.
 * Memoized per-request with React cache().
 */
export const getStorefrontCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  if (!slug) return null;

  try {
    const supabase = createPublicClient();
    let query = supabase.from('categories').select('*').eq('is_active', true);
    if (slug === 'all-makeup' || slug === 'makeup') {
      query = query.or('slug.eq.all-makeup,slug.eq.makeup');
    } else {
      query = query.eq('slug', slug);
    }
    const { data: rawCat, error } = await query.maybeSingle();

    if (!error && rawCat) {
      return mapSupabaseCategory(rawCat);
    }

    const mockMatch = MOCK_CATEGORIES.find((c) => c.slug === slug || (slug === 'all-makeup' && c.slug === 'makeup'));
    return mockMatch || null;
  } catch (err) {
    console.error('Error in getStorefrontCategoryBySlug:', slug, err);
    const mockMatch = MOCK_CATEGORIES.find((c) => c.slug === slug || (slug === 'all-makeup' && c.slug === 'makeup'));
    return mockMatch || null;
  }
});

/**
 * Fetches all active brands exclusively from Supabase, joining their product images
 * in a single query to automatically derive representative brand-card imagery.
 * Memoized per-request with React cache().
 */
export const getStorefrontBrands = cache(async (): Promise<Brand[]> => {
  try {
    const supabase = createPublicClient();
    const { data: rawBrands, error } = await supabase
      .from('brands')
      .select(`
        *,
        products (
          id,
          is_available,
          product_images (
            secure_url,
            is_primary,
            display_order
          )
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error || !rawBrands) {
      console.error('Error fetching Supabase storefront brands:', error);
      return [];
    }

    return rawBrands.map(mapSupabaseBrand);
  } catch (err) {
    console.error('Error in getStorefrontBrands:', err);
    return [];
  }
});

/**
 * Retrieves a brand by slug directly from Supabase with associated product imagery.
 * Memoized per-request with React cache().
 */
export const getStorefrontBrandBySlug = cache(async (slug: string): Promise<Brand | null> => {
  if (!slug) return null;

  try {
    const supabase = createPublicClient();
    const { data: rawBrand, error } = await supabase
      .from('brands')
      .select(`
        *,
        products (
          id,
          is_available,
          product_images (
            secure_url,
            is_primary,
            display_order
          )
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && rawBrand) {
      return mapSupabaseBrand(rawBrand);
    }

    return null;
  } catch (err) {
    console.error('Error in getStorefrontBrandBySlug:', slug, err);
    return null;
  }
});

/**
 * Retrieves products filtered by category slug.
 */
export async function getStorefrontProductsByCategory(categorySlug: string): Promise<Product[]> {
  const allProducts = await getStorefrontProducts();

  if (categorySlug === 'makeup') {
    return allProducts.filter((p) =>
      ['lipsticks', 'face-makeup', 'eye-makeup'].includes(p.categorySlug)
    );
  }

  return allProducts.filter((p) => p.categorySlug.toLowerCase() === categorySlug.toLowerCase());
}

/**
 * Retrieves products filtered by brand slug.
 */
export async function getStorefrontProductsByBrand(brandSlug: string): Promise<Product[]> {
  const allProducts = await getStorefrontProducts();
  return allProducts.filter((p) => p.brandSlug.toLowerCase() === brandSlug.toLowerCase());
}

/**
 * Retrieves related products for a product detail page.
 */
export async function getStorefrontRelatedProducts(
  currentProductId: string,
  categorySlug: string,
  limit = 4
): Promise<Product[]> {
  const allProducts = await getStorefrontProducts();
  return allProducts
    .filter(
      (p) =>
        p.id !== currentProductId &&
        (p.categorySlug.toLowerCase() === categorySlug.toLowerCase() || p.isFeatured)
    )
    .slice(0, limit);
}
