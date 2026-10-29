export interface ProductVariant {
  id: string;
  name: string;
  hex?: string;
  inStock: boolean;
}

export interface ProductSize {
  id: string;
  size: string;
  inStock: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  description: string;
  details: string[];
  howToUse?: string;
  ingredients?: string;
  images: string[];
  isAvailable: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  shades?: ProductVariant[];
  sizes?: ProductSize[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  featuredInNav?: boolean;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  banner: string;
  origin?: string;
  founded?: string;
}

export interface CartItem {
  id: string; // unique key combining product.id + variant
  product: Product;
  quantity: number;
  selectedShade?: string;
  selectedSize?: string;
}

export interface FilterState {
  category: string;
  brand: string;
  priceRange: [number, number];
  sortBy: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
  search: string;
}

export interface OrderItem {
  productName: string;
  brand: string;
  quantity: number;
  price: number;
  image: string;
  variant?: string;
}

export interface Order {
  id: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  items: OrderItem[];
  trackingNumber?: string;
  shippingAddress: string;
}

export interface Address {
  id: string;
  type: 'Home' | 'Work';
  isDefault: boolean;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

