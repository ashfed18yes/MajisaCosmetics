-- =============================================================================
-- Migration: 0003_product_management.sql
-- Description: Product Management Hardening & Schema Flexibility
--   1. Products: Make brand_id and category_id optional with ON DELETE SET NULL.
--   2. Products: Set default empty string on description (keeping NOT NULL).
--   3. Products: Add optional SKU with partial unique index for non-null values.
--   4. Products: Add optional stock_quantity with non-negative check constraint.
--   5. Categories: Make image_public_id and image_url optional (nullable).
--   6. Brands: Make logo and banner public_ids and URLs optional (nullable).
-- =============================================================================

-- =============================================================================
-- 1. Modify public.products Table
-- =============================================================================

-- 1.1 Make brand_id and category_id nullable to support unassigned products
ALTER TABLE public.products 
    ALTER COLUMN brand_id DROP NOT NULL,
    ALTER COLUMN category_id DROP NOT NULL;

-- 1.2 Replace foreign key constraints to support ON DELETE SET NULL
-- Drop existing PostgreSQL FK constraint for brand_id if present
ALTER TABLE public.products 
    DROP CONSTRAINT IF EXISTS products_brand_id_fkey;

ALTER TABLE public.products 
    ADD CONSTRAINT products_brand_id_fkey 
    FOREIGN KEY (brand_id) 
    REFERENCES public.brands(id) 
    ON DELETE SET NULL;

-- Drop existing PostgreSQL FK constraint for category_id if present
ALTER TABLE public.products 
    DROP CONSTRAINT IF EXISTS products_category_id_fkey;

ALTER TABLE public.products 
    ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) 
    REFERENCES public.categories(id) 
    ON DELETE SET NULL;

-- 1.3 Simplify description: set default empty string while preserving NOT NULL constraint
ALTER TABLE public.products 
    ALTER COLUMN description SET DEFAULT '';

-- 1.4 Add optional SKU column
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS sku TEXT NULL;

-- 1.5 Add optional stock_quantity column with non-negative check
-- Logic: NULL = untracked (always available), 0 = out of stock, >0 = tracked stock count
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NULL;

ALTER TABLE public.products 
    DROP CONSTRAINT IF EXISTS chk_products_stock_quantity;

ALTER TABLE public.products 
    ADD CONSTRAINT chk_products_stock_quantity 
    CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

-- 1.6 Ensure uniqueness of non-null SKUs
-- Partial unique index ensures all assigned SKUs are unique while allowing multiple NULLs
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_sku 
    ON public.products (sku) 
    WHERE sku IS NOT NULL;


-- =============================================================================
-- 2. Modify public.categories Table
-- =============================================================================

-- Make image fields optional to enable quick-adding categories inline
ALTER TABLE public.categories 
    ALTER COLUMN image_public_id DROP NOT NULL,
    ALTER COLUMN image_url DROP NOT NULL;


-- =============================================================================
-- 3. Modify public.brands Table
-- =============================================================================

-- Make logo and banner fields optional to enable quick-adding brands inline
ALTER TABLE public.brands 
    ALTER COLUMN logo_public_id DROP NOT NULL,
    ALTER COLUMN logo_url DROP NOT NULL,
    ALTER COLUMN banner_public_id DROP NOT NULL,
    ALTER COLUMN banner_url DROP NOT NULL;
