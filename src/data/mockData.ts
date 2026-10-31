import { Brand, Category, Product, Order, Address } from '@/types';

export const CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    slug: 'lipsticks',
    name: 'Lipsticks',
    tagline: 'Velvet Mattes, Satin Sheens & Rich Balms',
    description: 'Impart intense couture color with nourishing botanicals and weightless luxury finishes for every mood.',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=1000&auto=format&fit=crop',
    featuredInNav: true,
  },
  {
    id: 'cat-2',
    slug: 'skincare',
    name: 'Skincare',
    tagline: 'Radiance Elixirs & Restorative Hydration',
    description: 'Targeted botanical formulations infused with clinically proven actives for luminous, resilient skin.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&auto=format&fit=crop',
    featuredInNav: true,
  },
  {
    id: 'cat-3',
    slug: 'face-makeup',
    name: 'Face Makeup',
    tagline: 'Second-Skin Foundations & Luminous Blushes',
    description: 'Create an effortlessly flawless complexion with breathable formulas crafted to enhance your natural beauty.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000&auto=format&fit=crop',
    featuredInNav: true,
  },
  {
    id: 'cat-4',
    slug: 'eye-makeup',
    name: 'Eye Makeup',
    tagline: 'Sculpted Shadows & Precision Liners',
    description: 'High-chroma pigments and smudge-proof textures to frame your gaze with captivating definition.',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1000&auto=format&fit=crop',
    featuredInNav: true,
  },
  {
    id: 'cat-5',
    slug: 'sunscreen',
    name: 'Sunscreen',
    tagline: 'Invisible Shields & Broad-Spectrum UV Care',
    description: 'Zero white-cast, featherlight fluid protections with antioxidants to preserve your youth against daily light.',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1000&auto=format&fit=crop',
    featuredInNav: true,
  },
  {
    id: 'cat-6',
    slug: 'fragrances',
    name: 'Fragrances',
    tagline: 'Artisanal Extraits & Enthralling Accords',
    description: 'Rare florals, warm amber resins, and velvety woods that linger with unforgettable elegance.',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000&auto=format&fit=crop',
    featuredInNav: true,
  },
  {
    id: 'cat-7',
    slug: 'makeup',
    name: 'All Makeup',
    tagline: 'Complete Beauty Curations',
    description: 'Discover the full spectrum of Majisa couture makeup essentials for lips, eyes, and skin.',
    image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=1000&auto=format&fit=crop',
    featuredInNav: false,
  },
];

export const BRANDS: Brand[] = [
  {
    id: 'brand-1',
    slug: 'majisa-atelier',
    name: 'Majisa Atelier',
    tagline: 'Royal Heritage & Modern Elegance',
    description: 'The premier house creation. Handcrafted formulations marrying regal Indian botanical traditions with Parisian cosmetic chemistry.',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=1600&auto=format&fit=crop',
    origin: 'Jaipur & Paris',
    founded: '2023',
  },
  {
    id: 'brand-2',
    slug: 'lumiere-royale',
    name: 'Lumière Royale',
    tagline: 'Cellular Radiance & Youth Recovery',
    description: 'High-potency biotechnology skincare focused on barrier replenishment, marine collagens, and luminous reflection.',
    logo: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=300&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1600&auto=format&fit=crop',
    origin: 'Geneva',
    founded: '2019',
  },
  {
    id: 'brand-3',
    slug: 'velours-de-paris',
    name: 'Velours de Paris',
    tagline: 'Pigments of Pure Couture',
    description: 'Master lipstick artisans dedicated to comfortable 12-hour wear and saturated velvety tones inspired by haute couture runways.',
    logo: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=300&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1600&auto=format&fit=crop',
    origin: 'Paris',
    founded: '2020',
  },
  {
    id: 'brand-4',
    slug: 'aethelgard-botanicals',
    name: 'Aethelgard Botanicals',
    tagline: 'Pure Cold-Pressed Bio-Elixirs',
    description: 'Sustainably wild-harvested botanicals and adaptogens formulated into restorative oils and barrier repair balms.',
    logo: 'https://images.unsplash.com/photo-1608248597359-0a69a0a38d7c?q=80&w=300&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?q=80&w=1600&auto=format&fit=crop',
    origin: 'Copenhagen',
    founded: '2021',
  },
  {
    id: 'brand-5',
    slug: 'solaris-sun-labs',
    name: 'Solaris Sun Labs',
    tagline: 'Next-Gen Photoprotection',
    description: 'Ultralight mineral and hybrid sunscreen fluids featuring peptide infusions and non-greasy soft matte finishes.',
    logo: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=300&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1507914372368-b2b085b925a1?q=80&w=1600&auto=format&fit=crop',
    origin: 'Melbourne',
    founded: '2022',
  },
  {
    id: 'brand-6',
    slug: 'opulence-fragrances',
    name: 'Opulence Fragrances',
    tagline: 'Rare Olfactive Poetry',
    description: 'Small-batch luxury extraits blending Damascena rose, aged oudh, saffron, and Madagascar bourbon vanilla.',
    logo: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=300&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1600&auto=format&fit=crop',
    origin: 'Florence',
    founded: '2018',
  },
];

/**
 * Empty product catalog: real products are exclusively fetched from Supabase.
 */
export const PRODUCTS: Product[] = [];

/**
 * Empty orders catalog: user orders are maintained in the database.
 */
export const MOCK_ORDERS: Order[] = [];

export const MOCK_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    type: 'Home',
    isDefault: true,
    name: 'Rajkumari Sharma',
    street: '42 Raj Mahal Marg, Civil Lines',
    city: 'Jaipur',
    state: 'Rajasthan',
    postalCode: '302006',
    phone: '+91 98290 12345',
  },
  {
    id: 'addr-2',
    type: 'Work',
    isDefault: false,
    name: 'Rajkumari Sharma',
    street: 'Majisa Design Studio, 5th Floor, Tower B, Malviya Nagar',
    city: 'Jaipur',
    state: 'Rajasthan',
    postalCode: '302017',
    phone: '+91 98290 67890',
  },
];

// Helper search, filter, and getter functions
export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getBrandBySlug(slug: string): Brand | undefined {
  return BRANDS.find((b) => b.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  if (categorySlug === 'makeup') {
    return PRODUCTS.filter((p) => ['lipsticks', 'face-makeup', 'eye-makeup'].includes(p.categorySlug));
  }
  return PRODUCTS.filter((p) => p.categorySlug === categorySlug);
}

export function getProductsByBrand(brandSlug: string): Product[] {
  return PRODUCTS.filter((p) => p.brandSlug === brandSlug);
}

export function getBestsellers(): Product[] {
  return PRODUCTS.filter((p) => p.isBestseller);
}

export function getFeaturedProducts(): Product[] {
  return PRODUCTS.filter((p) => p.isFeatured);
}

export function getRelatedProducts(currentProductId: string, categorySlug: string, limit = 4): Product[] {
  return PRODUCTS.filter((p) => p.id !== currentProductId && (p.categorySlug === categorySlug || p.isFeatured)).slice(0, limit);
}
