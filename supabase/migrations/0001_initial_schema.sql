-- =============================================================================
-- Migration: 0001_initial_schema.sql
-- Description: Initial database schema for Majisa Cosmetics e-commerce platform.
-- Architecture: Supabase PostgreSQL + Cloudinary Storage integration.
-- =============================================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. Helper Functions & Triggers
-- =============================================================================

-- Universal updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Secure is_admin() helper with fixed search_path to prevent search_path exploits
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================================================
-- 2. User & Customer Management Tables
-- =============================================================================

-- Table: public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NULL,
    avatar_public_id TEXT NULL,
    avatar_url TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table: public.user_roles (RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('customer', 'admin')) DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_roles UNIQUE (user_id, role)
);

-- Table: public.addresses
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    address_type TEXT NOT NULL CHECK (address_type IN ('Home', 'Work')) DEFAULT 'Home',
    is_default BOOLEAN NOT NULL DEFAULT false,
    recipient_name TEXT NOT NULL,
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 3. Dynamic Store Settings (Public vs. Private Segregated)
-- =============================================================================

-- Table: public.store_settings
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    description TEXT NULL,
    updated_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_store_settings_updated_at
    BEFORE UPDATE ON public.store_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 4. Catalog Management Tables (Categories, Brands, Products, Variants)
-- =============================================================================

-- Table: public.categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    image_public_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    featured_in_nav BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table: public.brands
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    logo_public_id TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    banner_public_id TEXT NOT NULL,
    banner_url TEXT NOT NULL,
    origin TEXT NULL,
    founded_year TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table: public.products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
    original_price NUMERIC(10,2) NULL CHECK (original_price IS NULL OR original_price >= base_price),
    rating NUMERIC(2,1) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    description TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '[]'::jsonb,
    how_to_use TEXT NULL,
    ingredients TEXT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table: public.product_images
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    public_id TEXT NOT NULL,
    secure_url TEXT NOT NULL,
    width INTEGER NULL,
    height INTEGER NULL,
    alt_text TEXT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Constraint: At most one primary image per product
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_primary_image
    ON public.product_images (product_id)
    WHERE is_primary = true;

-- Table: public.product_variants (Shades & Sizes with price override support)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_type TEXT NOT NULL CHECK (variant_type IN ('shade', 'size')),
    name TEXT NOT NULL,
    hex_code TEXT NULL,
    price_override NUMERIC(10,2) NULL CHECK (price_override IS NULL OR price_override >= 0),
    original_price_override NUMERIC(10,2) NULL CHECK (original_price_override IS NULL OR original_price_override >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_variant_prices CHECK (
        original_price_override IS NULL OR price_override IS NULL OR original_price_override >= price_override
    )
);

-- =============================================================================
-- 5. Order & Snapshot Tables
-- =============================================================================

-- Table: public.orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN (
        'Pending Verification',
        'Payment Action Required',
        'Confirmed',
        'Processing',
        'Dispatched',
        'Delivered',
        'Cancelled'
    )) DEFAULT 'Pending Verification',
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    shipping_address_snapshot JSONB NOT NULL,
    customer_notes TEXT NULL,
    tracking_number TEXT NULL,
    courier_partner TEXT NULL,
    dispatched_at TIMESTAMPTZ NULL,
    delivered_at TIMESTAMPTZ NULL,
    cancelled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table: public.order_items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NULL REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID NULL REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    variant_name TEXT NULL,
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
    image_url TEXT NOT NULL
);

-- =============================================================================
-- 6. Payment & Verification Tables
-- =============================================================================

-- Table: public.payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('online_qr', 'cod_advance')),
    amount_expected NUMERIC(10,2) NOT NULL CHECK (amount_expected >= 0),
    amount_submitted NUMERIC(10,2) NOT NULL CHECK (amount_submitted >= 0),
    advance_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (advance_amount >= 0),
    balance_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (balance_amount >= 0),
    utr_reference TEXT NOT NULL,
    proof_public_id TEXT NOT NULL,
    proof_file_format TEXT NOT NULL DEFAULT 'jpg',
    verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    verified_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ NULL,
    rejection_reason TEXT NULL,
    admin_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_order_attempt UNIQUE (order_id, attempt_number)
);

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Anti-Fraud Constraint: Disallow reuse of the same UTR across any active/verified payment
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_active_reference
    ON public.payments (utr_reference)
    WHERE verification_status IN ('pending', 'verified');

-- =============================================================================
-- 7. Performance Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands (slug);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand_id) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products (is_bestseller) WHERE is_bestseller = true;
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images (product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants (product_id, display_order);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments (order_id, attempt_number DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (verification_status);

-- =============================================================================
-- 8. Row Level Security (RLS) Enablement
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 9. Row Level Security Policies
-- =============================================================================

-- Profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

-- User Roles (Decoupled: only own role readable, guaranteeing 100% recursion immunity)
CREATE POLICY "user_roles_select_policy" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Addresses
CREATE POLICY "addresses_select_policy" ON public.addresses
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "addresses_insert_policy" ON public.addresses
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "addresses_update_policy" ON public.addresses
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "addresses_delete_policy" ON public.addresses
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

-- Store Settings (Public vs. Private Segregation)
CREATE POLICY "store_settings_public_select" ON public.store_settings
    FOR SELECT TO anon, authenticated
    USING (is_public = true OR public.is_admin());

CREATE POLICY "store_settings_admin_all" ON public.store_settings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Categories
CREATE POLICY "categories_select_policy" ON public.categories
    FOR SELECT TO anon, authenticated
    USING (is_active = true OR public.is_admin());

CREATE POLICY "categories_admin_all" ON public.categories
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Brands
CREATE POLICY "brands_select_policy" ON public.brands
    FOR SELECT TO anon, authenticated
    USING (is_active = true OR public.is_admin());

CREATE POLICY "brands_admin_all" ON public.brands
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Products
CREATE POLICY "products_select_policy" ON public.products
    FOR SELECT TO anon, authenticated
    USING (is_available = true OR public.is_admin());

CREATE POLICY "products_admin_all" ON public.products
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Product Images
CREATE POLICY "product_images_select_policy" ON public.product_images
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "product_images_admin_all" ON public.product_images
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Product Variants
CREATE POLICY "product_variants_select_policy" ON public.product_variants
    FOR SELECT TO anon, authenticated
    USING (is_available = true OR public.is_admin());

CREATE POLICY "product_variants_admin_all" ON public.product_variants
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Orders (Read: customer can view own, admin can view all. Write: server actions / admin only)
CREATE POLICY "orders_select_policy" ON public.orders
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "orders_admin_all" ON public.orders
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Order Items
CREATE POLICY "order_items_select_policy" ON public.order_items
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    ));

CREATE POLICY "order_items_admin_all" ON public.order_items
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Payments (Read: customer can view own, admin can view all. Write: server actions / admin only)
CREATE POLICY "payments_select_policy" ON public.payments
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = payments.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    ));

CREATE POLICY "payments_admin_all" ON public.payments
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- =============================================================================
-- 10. Automatic Customer Profile & Default Role Creation Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Valued Customer'),
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Customer role is guaranteed default (Admin assignment is strictly server-only)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 11. Initial Grants (Aligned with RLS Policies)
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Customer-permitted write tables (governed by user_id = auth.uid() RLS policies)
GRANT INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Admin-permitted write tables (strictly governed by is_admin() RLS policies)
GRANT INSERT, UPDATE, DELETE ON 
    public.categories, 
    public.brands, 
    public.products, 
    public.product_images, 
    public.product_variants, 
    public.store_settings, 
    public.orders, 
    public.order_items, 
    public.payments 
TO authenticated;
