import { createClient } from '@/lib/supabase/server';
import { Product, Category, Brand, ProductVariant, ProductSize } from '@/types';
import {
  CATEGORIES as MOCK_CATEGORIES,
  BRANDS as MOCK_BRANDS,
} from '@/data/mockData';

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop';
const DEFAULT_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000&auto=format&fit=crop';
const DEFAULT_BRAND_LOGO =
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300&auto=format&fit=crop';
const DEFAULT_BRAND_BANNER =
  'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=1600&auto=format&fit=crop';

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
    image: c.image_url?.trim() || DEFAULT_CATEGORY_IMAGE,
    featuredInNav: c.featured_in_nav ?? true,
  };
}

/**
 * Transforms a raw Supabase brand row into the frontend `Brand` interface.
 */
function mapSupabaseBrand(b: any): Brand {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    tagline: b.tagline || 'Artisanal Beauty House',
    description: b.description || 'Dedicated to uncompromising purity, botanical science, and cruelty-free luxury standards.',
    logo: b.logo_url?.trim() || DEFAULT_BRAND_LOGO,
    banner: b.banner_url?.trim() || DEFAULT_BRAND_BANNER,
    origin: b.origin || 'Jaipur',
    founded: b.founded_year || undefined,
  };
}

/**
 * Fetches all available products exclusively from Supabase.
 * Returns only real database products; returns empty array if none exist or on error.
 */
export async function getStorefrontProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
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
}

/**
 * Retrieves a single product by its URL slug directly from Supabase.
 * Returns null if not found or on error (no mock fallback).
 */
export async function getStorefrontProductBySlug(slug: string): Promise<Product | null> {
  if (!slug) return null;

  try {
    const supabase = await createClient();
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
}

/**
 * Fetches all categories from Supabase merged with mock categories.
 */
export async function getStorefrontCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const { data: rawCats, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !rawCats) {
      return MOCK_CATEGORIES;
    }

    const liveCats = rawCats.map(mapSupabaseCategory);
    const liveSlugs = new Set(liveCats.map((c) => c.slug));
    const nonConflictingMock = MOCK_CATEGORIES.filter((m) => !liveSlugs.has(m.slug));

    return [...liveCats, ...nonConflictingMock];
  } catch (err) {
    console.error('Error in getStorefrontCategories:', err);
    return MOCK_CATEGORIES;
  }
}

/**
 * Retrieves a category by slug from Supabase or fallback.
 */
export async function getStorefrontCategoryBySlug(slug: string): Promise<Category | null> {
  if (!slug) return null;

  try {
    const supabase = await createClient();
    const { data: rawCat, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && rawCat) {
      return mapSupabaseCategory(rawCat);
    }

    const mockMatch = MOCK_CATEGORIES.find((c) => c.slug === slug);
    return mockMatch || null;
  } catch (err) {
    console.error('Error in getStorefrontCategoryBySlug:', slug, err);
    const mockMatch = MOCK_CATEGORIES.find((c) => c.slug === slug);
    return mockMatch || null;
  }
}

/**
 * Fetches all brands from Supabase merged with mock brands.
 */
export async function getStorefrontBrands(): Promise<Brand[]> {
  try {
    const supabase = await createClient();
    const { data: rawBrands, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error || !rawBrands) {
      return MOCK_BRANDS;
    }

    const liveBrands = rawBrands.map(mapSupabaseBrand);
    const liveSlugs = new Set(liveBrands.map((b) => b.slug));
    const nonConflictingMock = MOCK_BRANDS.filter((m) => !liveSlugs.has(m.slug));

    return [...liveBrands, ...nonConflictingMock];
  } catch (err) {
    console.error('Error in getStorefrontBrands:', err);
    return MOCK_BRANDS;
  }
}

/**
 * Retrieves a brand by slug from Supabase or fallback.
 */
export async function getStorefrontBrandBySlug(slug: string): Promise<Brand | null> {
  if (!slug) return null;

  try {
    const supabase = await createClient();
    const { data: rawBrand, error } = await supabase
      .from('brands')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && rawBrand) {
      return mapSupabaseBrand(rawBrand);
    }

    const mockMatch = MOCK_BRANDS.find((b) => b.slug === slug);
    return mockMatch || null;
  } catch (err) {
    console.error('Error in getStorefrontBrandBySlug:', slug, err);
    const mockMatch = MOCK_BRANDS.find((b) => b.slug === slug);
    return mockMatch || null;
  }
}

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
