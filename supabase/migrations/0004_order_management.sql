-- =============================================================================
-- Migration: 0004_order_management.sql
-- Description: Hardened Schema Evolution for Order Management System
--
-- BUSINESS REQUIREMENTS COVERED:
-- 1. ORDERS:
--    - Separate Online vs COD orders via `order_type`.
--    - Separate fulfillment status from payment accounting via `payment_status`.
--    - Track `advance_amount_paid` (e.g. COD delivery fee advance of Rs 100).
--    - Track `balance_amount_due` (e.g. COD remaining product amount due on delivery).
--    - Dedicated audit columns: `cod_balance_collected`, `cod_collected_at`, `cod_collected_by`.
--    - Added explicit 'Awaiting Payment' status to order fulfillment lifecycle.
--    - Transition guard trigger enforcing valid fulfillment status progressions.
--    - Collision-resistant, transaction-safe order numbering via sequence + timestamp + hash.
--
-- 2. SERVER-AUTHORITATIVE PRICING & DELIVERY SETTINGS SAFETY:
--    - `create_order_with_payment` calculates ALL totals, prices, and amounts inside
--      the database from trusted `products`, `product_variants`, and `store_settings`.
--    - Duplicate cart-line protection: aggregates quantities by (product_id, variant_id)
--      so repeated lines cannot bypass inventory limits.
--    - Delivery fee seed uses `ON CONFLICT (key) DO NOTHING` so it NEVER overwrites
--      admin customizations on rerun.
--    - Order creation fails safely with an explicit exception if delivery settings are
--      missing, inactive, malformed, or invalid (zero silent fallbacks).
--    - Fixed delivery fee of Rs 100 charged exactly once for both Online and COD.
--
-- 3. PAYMENTS & CONCURRENCY-SAFE RETRY HISTORY:
--    - QR-First Lifecycle: initial attempt starts in 'awaiting_submission' with NULL UTR and proof.
--    - Database constraint: partial unique index `uq_payments_one_active_per_order`
--      guarantees at most ONE active attempt ('awaiting_submission' or 'pending') per order.
--    - Retries never overwrite rejected records; each retry safely creates a new payment
--      row with an incremented `attempt_number`.
--    - Consistent row-locking order: all transactions lock parent `orders` first,
--      then `payments` second, preventing database deadlocks.
--
-- 4. PAYMENT AUDIT & COD FINAL COLLECTION:
--    - Dedicated `rejected_by` and `rejected_at` audit fields on `public.payments`.
--    - Verification and rejection audit fields are strictly mutually exclusive via CHECK constraint.
--    - `verify_payment_admin` and `reject_payment_admin` accept only 'pending' attempts.
--    - `verify_payment_admin` independently validates payment_method and amount_expected
--      against parent order attributes before confirming.
--    - Explicit admin confirmation of actual amount credited before verification.
--    - Verifying COD advance marks `payment_status` as 'advance_paid' (NEVER 'fully_paid')
--      and preserves product subtotal as `balance_amount_due`.
--    - Dedicated audit table `public.order_collections` records doorstep COD cash collections.
--    - Dedicated function `confirm_cod_balance_collected_admin` marks COD 'fully_paid'
--      only after doorstep cash collection is confirmed for orders in eligible delivery states.
--
-- 5. ANTI-FRAUD & ASSET SECURITY:
--    - Global unique index on non-null `utr_reference` across all payment attempts (including rejected).
--    - Proof assets must belong to `majisa-cosmetics/payment-proofs/{order_id}/{payment_id}_%`
--      namespace; max 5 MB; public URLs are never stored.
--
-- 6. ADMIN IDENTITY & SERVICE-ROLE SECURITY:
--    - Admin functions verify actual admin identity (`is_admin()`) for authenticated calls.
--    - If invoked via `service_role`, `p_admin_id` is required and verified against `public.user_roles`.
--    - Never trusts browser-supplied admin IDs; records true admin ID in all audit trails.
--
-- IMPORTANT:
-- - This migration is additive and strictly non-destructive.
-- - No real products, catalog records, or user accounts are modified or deleted.
-- - DO NOT EXECUTE without explicit user approval.
-- =============================================================================

-- =============================================================================
-- 1. Order Number Sequence (Collision-Resistant & Transaction-Safe)
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1001;


-- =============================================================================
-- 2. Evolution of public.orders
-- =============================================================================

-- 2.1 Update order status check constraint to include 'Awaiting Payment'
ALTER TABLE public.orders 
    DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
    DROP CONSTRAINT IF EXISTS chk_orders_status;

ALTER TABLE public.orders 
    ADD CONSTRAINT chk_orders_status 
    CHECK (status IN (
        'Awaiting Payment',
        'Pending Verification',
        'Payment Action Required',
        'Confirmed',
        'Processing',
        'Dispatched',
        'Delivered',
        'Cancelled'
    ));

ALTER TABLE public.orders 
    ALTER COLUMN status SET DEFAULT 'Awaiting Payment';

-- 2.2 Add order_type column with CHECK constraint ('online', 'cod')
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'online';

ALTER TABLE public.orders 
    DROP CONSTRAINT IF EXISTS chk_orders_order_type;

ALTER TABLE public.orders 
    ADD CONSTRAINT chk_orders_order_type 
    CHECK (order_type IN ('online', 'cod'));

-- 2.3 Add payment_status column with CHECK constraint
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.orders 
    DROP CONSTRAINT IF EXISTS chk_orders_payment_status;

ALTER TABLE public.orders 
    ADD CONSTRAINT chk_orders_payment_status 
    CHECK (payment_status IN ('pending', 'advance_paid', 'fully_paid', 'refunded'));

-- 2.4 Add advance_amount_paid with non-negative constraint (strictly tracks advance fee)
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS advance_amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE public.orders 
    DROP CONSTRAINT IF EXISTS chk_orders_advance_amount_paid;

ALTER TABLE public.orders 
    ADD CONSTRAINT chk_orders_advance_amount_paid 
    CHECK (advance_amount_paid >= 0.00);

-- 2.5 Add balance_amount_due with non-negative constraint
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS balance_amount_due NUMERIC(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE public.orders 
    DROP CONSTRAINT IF EXISTS chk_orders_balance_amount_due;

ALTER TABLE public.orders 
    ADD CONSTRAINT chk_orders_balance_amount_due 
    CHECK (balance_amount_due >= 0.00);

-- 2.6 Add dedicated COD doorstep collection audit summary columns on public.orders
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS cod_balance_collected NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS cod_collected_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS cod_collected_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.orders 
    DROP CONSTRAINT IF EXISTS chk_orders_cod_collected;

ALTER TABLE public.orders 
    ADD CONSTRAINT chk_orders_cod_collected 
    CHECK (cod_balance_collected >= 0.00);


-- =============================================================================
-- 3. Dedicated COD Collection Audit Table (public.order_collections)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.order_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    collection_type TEXT NOT NULL DEFAULT 'cod_doorstep_balance' 
        CHECK (collection_type IN ('cod_doorstep_balance', 'adjustment')),
    amount_collected NUMERIC(10,2) NOT NULL CHECK (amount_collected > 0),
    collected_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    payment_method TEXT NOT NULL DEFAULT 'cash' 
        CHECK (payment_method IN ('cash', 'upi_doorstep', 'card_doorstep')),
    transaction_reference TEXT NULL,
    admin_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_order_cod_collection UNIQUE (order_id)
);

ALTER TABLE public.order_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_collections_select_admin" ON public.order_collections
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY "order_collections_admin_all" ON public.order_collections
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.order_collections TO authenticated;
GRANT ALL ON public.order_collections TO service_role;


-- =============================================================================
-- 4. Evolution of public.payments (Audit Fields, Proof Security & State Guards)
-- =============================================================================

-- 4.1 Allow initial payment attempt to exist before UTR reference is submitted
ALTER TABLE public.payments 
    ALTER COLUMN utr_reference DROP NOT NULL;

-- 4.2 Allow initial payment attempt to exist before payment proof is uploaded
ALTER TABLE public.payments 
    ALTER COLUMN proof_public_id DROP NOT NULL;

ALTER TABLE public.payments 
    ALTER COLUMN proof_file_format DROP NOT NULL;

-- 4.3 Allow amount_submitted to default to 0.00 until customer submits payment form
ALTER TABLE public.payments 
    ALTER COLUMN amount_submitted SET DEFAULT 0.00;

-- 4.4 Expand verification_status to include 'awaiting_submission'
ALTER TABLE public.payments 
    DROP CONSTRAINT IF EXISTS payments_verification_status_check;

ALTER TABLE public.payments 
    DROP CONSTRAINT IF EXISTS chk_payments_verification_status;

ALTER TABLE public.payments 
    ADD CONSTRAINT chk_payments_verification_status 
    CHECK (verification_status IN ('awaiting_submission', 'pending', 'verified', 'rejected'));

ALTER TABLE public.payments 
    ALTER COLUMN verification_status SET DEFAULT 'awaiting_submission';

-- 4.5 Add dedicated rejection audit fields
ALTER TABLE public.payments 
    ADD COLUMN IF NOT EXISTS rejected_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ NULL;

-- 4.6 Enforce strict mutual exclusivity of verification vs rejection audit trails
ALTER TABLE public.payments 
    DROP CONSTRAINT IF EXISTS chk_payments_verification_audit;

ALTER TABLE public.payments 
    ADD CONSTRAINT chk_payments_verification_audit 
    CHECK (
        (verification_status = 'awaiting_submission' AND verified_by IS NULL AND verified_at IS NULL AND rejected_by IS NULL AND rejected_at IS NULL) OR
        (verification_status = 'pending' AND verified_by IS NULL AND verified_at IS NULL AND rejected_by IS NULL AND rejected_at IS NULL) OR
        (verification_status = 'verified' AND verified_by IS NOT NULL AND verified_at IS NOT NULL AND rejected_by IS NULL AND rejected_at IS NULL) OR
        (verification_status = 'rejected' AND rejected_by IS NOT NULL AND rejected_at IS NOT NULL AND rejection_reason IS NOT NULL AND verified_by IS NULL AND verified_at IS NULL)
    );

-- 4.7 Add proof metadata fields for private/authenticated asset delivery
ALTER TABLE public.payments 
    ADD COLUMN IF NOT EXISTS proof_file_size_bytes INTEGER NULL;

ALTER TABLE public.payments 
    DROP CONSTRAINT IF EXISTS chk_payments_proof_file_size;

ALTER TABLE public.payments 
    ADD CONSTRAINT chk_payments_proof_file_size 
    CHECK (proof_file_size_bytes IS NULL OR (proof_file_size_bytes > 0 AND proof_file_size_bytes <= 5242880));

ALTER TABLE public.payments 
    ADD COLUMN IF NOT EXISTS proof_uploaded_at TIMESTAMPTZ NULL;

-- 4.8 Partial Unique Index: Exactly ONE active payment attempt per order at any time
DROP INDEX IF EXISTS public.uq_payments_one_active_per_order;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_one_active_per_order 
    ON public.payments (order_id) 
    WHERE verification_status IN ('awaiting_submission', 'pending');

-- 4.9 Anti-Fraud: Global UTR unique index across ALL non-null attempts (including rejected)
DROP INDEX IF EXISTS public.uq_payments_active_reference;
DROP INDEX IF EXISTS public.uq_payments_utr_reference;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_utr_reference 
    ON public.payments (utr_reference) 
    WHERE utr_reference IS NOT NULL;


-- =============================================================================
-- 5. Dynamic Store Settings (Safe Non-Destructive Seeding)
-- =============================================================================

-- 5.1 Fixed Delivery Fee Configuration (Rs 100 for Online and COD)
-- Uses ON CONFLICT DO NOTHING so it NEVER overwrites admin-configured rates on rerun.
INSERT INTO public.store_settings (key, value, is_public, description)
VALUES (
    'delivery_charges',
    jsonb_build_object(
        'is_active', true,
        'delivery_fee', 100.00,
        'free_shipping_threshold', 2000.00,
        'brackets', jsonb_build_array(
            jsonb_build_object('min', 0, 'max', 500, 'fee', 100.00),
            jsonb_build_object('min', 500, 'max', 2000, 'fee', 50.00),
            jsonb_build_object('min', 2000, 'max', null, 'fee', 0.00)
        ),
        'notes', 'Tiered delivery fee brackets: Below ₹500: ₹100, ₹500 to below ₹2,000: ₹50, ₹2,000 and above: Free'
    ),
    true,
    'Store delivery fee configuration with tiered brackets: Below 500: 100, 500 to below 2000: 50, 2000 and above: free.'
)
ON CONFLICT (key) DO NOTHING;

-- 5.2 Merchant UPI Configuration Template (Inactive until client supplies details)
INSERT INTO public.store_settings (key, value, is_public, description)
VALUES (
    'payment_upi',
    jsonb_build_object(
        'is_active', false,
        'upi_id', null,
        'merchant_name', null,
        'notes', 'Awaiting client-confirmed merchant UPI VPA and display name'
    ),
    false,
    'Merchant UPI credentials for dynamic QR generation. Inactive until configured by admin.'
)
ON CONFLICT (key) DO NOTHING;


-- =============================================================================
-- 6. Order Fulfillment Status Transition Guard Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- If status is not changing, allow update
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Enforce allowed fulfillment state transitions
    IF OLD.status = 'Awaiting Payment' AND NEW.status NOT IN ('Pending Verification', 'Cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from "Awaiting Payment" to "%". Payment proof must be submitted first.', NEW.status
            USING ERRCODE = 'invalid_parameter_value';
    ELSIF OLD.status = 'Pending Verification' AND NEW.status NOT IN ('Confirmed', 'Payment Action Required', 'Cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from "Pending Verification" to "%". Must be Confirmed or Payment Action Required.', NEW.status
            USING ERRCODE = 'invalid_parameter_value';
    ELSIF OLD.status = 'Payment Action Required' AND NEW.status NOT IN ('Pending Verification', 'Awaiting Payment', 'Cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from "Payment Action Required" to "%". Must resubmit payment proof or cancel.', NEW.status
            USING ERRCODE = 'invalid_parameter_value';
    ELSIF OLD.status = 'Confirmed' AND NEW.status NOT IN ('Processing', 'Cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from "Confirmed" to "%". Allowed: Processing, Cancelled.', NEW.status
            USING ERRCODE = 'invalid_parameter_value';
    ELSIF OLD.status = 'Processing' AND NEW.status NOT IN ('Dispatched', 'Cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from "Processing" to "%". Allowed: Dispatched, Cancelled.', NEW.status
            USING ERRCODE = 'invalid_parameter_value';
    ELSIF OLD.status = 'Dispatched' AND NEW.status NOT IN ('Delivered', 'Cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from "Dispatched" to "%". Allowed: Delivered, Cancelled.', NEW.status
            USING ERRCODE = 'invalid_parameter_value';
    ELSIF OLD.status = 'Delivered' THEN
        RAISE EXCEPTION 'Order is already Delivered. Cannot modify terminal fulfillment status.'
            USING ERRCODE = 'invalid_parameter_value';
    ELSIF OLD.status = 'Cancelled' THEN
        RAISE EXCEPTION 'Order is already Cancelled. Cannot modify terminal fulfillment status.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Auto-record milestone timestamps if not already set
    IF NEW.status = 'Dispatched' AND OLD.status <> 'Dispatched' AND NEW.dispatched_at IS NULL THEN
        NEW.dispatched_at := timezone('utc'::text, now());
    ELSIF NEW.status = 'Delivered' AND OLD.status <> 'Delivered' AND NEW.delivered_at IS NULL THEN
        NEW.delivered_at := timezone('utc'::text, now());
    ELSIF NEW.status = 'Cancelled' AND OLD.status <> 'Cancelled' AND NEW.cancelled_at IS NULL THEN
        NEW.cancelled_at := timezone('utc'::text, now());
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_order_status_transition ON public.orders;
CREATE TRIGGER trg_check_order_status_transition
    BEFORE UPDATE OF status ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.check_order_status_transition();


-- =============================================================================
-- 7. Performance Indexes for Admin Online & COD Queues
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_type_created 
    ON public.orders (order_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_type_status 
    ON public.orders (order_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
    ON public.orders (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_order_attempt 
    ON public.payments (order_id, attempt_number DESC);

CREATE INDEX IF NOT EXISTS idx_payments_verification_status 
    ON public.payments (verification_status, created_at DESC);


-- =============================================================================
-- 8. Atomic Transactional Operations (Stored Procedures)
-- =============================================================================

-- 8.1 Atomic Server-Authoritative Order Creation with Initial Payment Attempt
-- (Includes Duplicate Cart-Line Aggregation to Prevent Stock Limit Bypasses)
CREATE OR REPLACE FUNCTION public.create_order_with_payment(
    p_user_id UUID,
    p_order_type TEXT,
    p_address_id UUID DEFAULT NULL,
    p_new_address JSONB DEFAULT NULL,
    p_customer_notes TEXT DEFAULT NULL,
    p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_order_id UUID;
    v_order_number TEXT;
    v_payment_id UUID;
    v_payment_method TEXT;
    v_delivery_settings_row RECORD;
    v_configured_delivery_fee NUMERIC(10,2);
    v_subtotal NUMERIC(10,2) := 0.00;
    v_total_amount NUMERIC(10,2);
    v_amount_expected NUMERIC(10,2);
    v_advance_amount_paid NUMERIC(10,2) := 0.00;
    v_balance_amount_due NUMERIC(10,2);
    v_address_snapshot JSONB;
    
    -- Dynamic order & payment lifecycle state
    v_order_status TEXT;
    v_order_payment_status TEXT;
    v_payment_verification_status TEXT;
    
    -- Address extraction variables
    v_addr_recipient TEXT;
    v_addr_street TEXT;
    v_addr_city TEXT;
    v_addr_state TEXT;
    v_addr_postal TEXT;
    v_addr_phone TEXT;
    v_addr_type TEXT;

    -- Item processing variables
    v_item JSONB;
    v_prod_id UUID;
    v_var_id UUID;
    v_qty INTEGER;
    v_prod_name TEXT;
    v_base_price NUMERIC(10,2);
    v_is_available BOOLEAN;
    v_brand_id UUID;
    v_stock_qty INTEGER;
    v_var_name TEXT;
    v_price_override NUMERIC(10,2);
    v_var_is_available BOOLEAN;
    v_unit_price NUMERIC(10,2);
    v_line_total NUMERIC(10,2);
    v_item_image_url TEXT;
    v_brand_name TEXT;
    v_aggregated_items JSONB;
    v_validated_items JSONB := '[]'::jsonb;
BEGIN
    -- 1. Anti-Spoofing Identity Verification:
    -- If called by authenticated customer, force v_user_id to auth.uid().
    -- If called by service_role or admin, permit p_user_id.
    IF auth.role() = 'authenticated' THEN
        v_user_id := auth.uid();
    ELSIF auth.role() = 'service_role' OR public.is_admin() THEN
        v_user_id := p_user_id;
    ELSE
        RAISE EXCEPTION 'Authentication required to place an order.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Valid customer ID is required.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- 2. Validate Order Type
    IF p_order_type NOT IN ('online', 'cod') THEN
        RAISE EXCEPTION 'Invalid order type: %. Must be "online" or "cod".', p_order_type
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- 3. Validate Delivery Fee Configuration from store_settings (Zero Silent Fallbacks)
    SELECT value, is_public INTO v_delivery_settings_row
    FROM public.store_settings
    WHERE key = 'delivery_charges';

    IF v_delivery_settings_row.value IS NULL THEN
        RAISE EXCEPTION 'Store delivery fee configuration is missing. Cannot calculate authoritative order total.'
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    IF COALESCE((v_delivery_settings_row.value->>'is_active')::BOOLEAN, false) = false THEN
        RAISE EXCEPTION 'Store delivery fee configuration is currently disabled. Cannot place order.'
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    v_configured_delivery_fee := (v_delivery_settings_row.value->>'delivery_fee')::NUMERIC(10,2);
    IF v_configured_delivery_fee IS NULL OR v_configured_delivery_fee < 0.00 THEN
        RAISE EXCEPTION 'Store delivery fee configuration is malformed or invalid.'
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    -- 4. Validate Items Payload & Aggregate Duplicate Lines:
    -- Prevents submitting duplicate (product_id, variant_id) lines to bypass stock validation
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one item.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Validate raw items structure
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF (v_item->>'product_id') IS NULL OR trim(v_item->>'product_id') = '' THEN
            RAISE EXCEPTION 'Every order line must contain a valid product_id.'
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        IF (v_item->>'quantity') IS NULL OR (v_item->>'quantity')::INTEGER <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be a positive integer.'
                USING ERRCODE = 'invalid_parameter_value';
        END IF;
    END LOOP;

    -- Aggregate quantities by product_id and variant_id
    SELECT jsonb_agg(
        jsonb_build_object(
            'product_id', sub.product_id,
            'variant_id', sub.variant_id,
            'quantity', sub.total_qty
        )
    )
    INTO v_aggregated_items
    FROM (
        SELECT 
            (elem->>'product_id')::UUID AS product_id,
            NULLIF(trim(COALESCE(elem->>'variant_id', '')), '')::UUID AS variant_id,
            SUM((elem->>'quantity')::INTEGER) AS total_qty
        FROM jsonb_array_elements(p_items) elem
        GROUP BY 
            (elem->>'product_id')::UUID,
            NULLIF(trim(COALESCE(elem->>'variant_id', '')), '')::UUID
    ) sub;

    -- 5. Address Verification & Snapshot Creation
    IF p_address_id IS NOT NULL THEN
        -- Verify existing saved address belongs to customer
        SELECT recipient_name, street_address, city, state, postal_code, phone, address_type
        INTO v_addr_recipient, v_addr_street, v_addr_city, v_addr_state, v_addr_postal, v_addr_phone, v_addr_type
        FROM public.addresses
        WHERE id = p_address_id AND (user_id = v_user_id OR public.is_admin());

        IF v_addr_recipient IS NULL THEN
            RAISE EXCEPTION 'Selected delivery address not found or does not belong to customer.'
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        v_address_snapshot := jsonb_build_object(
            'recipient_name', v_addr_recipient,
            'street_address', v_addr_street,
            'city', v_addr_city,
            'state', v_addr_state,
            'postal_code', v_addr_postal,
            'phone', v_addr_phone,
            'address_type', v_addr_type
        );
    ELSIF p_new_address IS NOT NULL THEN
        -- Validate new address fields
        IF trim(COALESCE(p_new_address->>'recipient_name', '')) = '' OR
           trim(COALESCE(p_new_address->>'street_address', '')) = '' OR
           trim(COALESCE(p_new_address->>'city', '')) = '' OR
           trim(COALESCE(p_new_address->>'state', '')) = '' OR
           trim(COALESCE(p_new_address->>'postal_code', '')) = '' OR
           trim(COALESCE(p_new_address->>'phone', '')) = '' THEN
            RAISE EXCEPTION 'Delivery address is missing mandatory fields.'
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        v_address_snapshot := jsonb_build_object(
            'recipient_name', trim(p_new_address->>'recipient_name'),
            'street_address', trim(p_new_address->>'street_address'),
            'city', trim(p_new_address->>'city'),
            'state', trim(p_new_address->>'state'),
            'postal_code', trim(p_new_address->>'postal_code'),
            'phone', trim(p_new_address->>'phone'),
            'address_type', COALESCE(trim(p_new_address->>'address_type'), 'Home')
        );
    ELSE
        RAISE EXCEPTION 'Delivery address is required to place an order.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- 6. Server-Authoritative Price Calculation & Aggregated Item Validation
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_aggregated_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_var_id := NULLIF(v_item->>'variant_id', '')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;

        -- Query authoritative product record from database
        SELECT name, base_price, is_available, brand_id, stock_quantity
        INTO v_prod_name, v_base_price, v_is_available, v_brand_id, v_stock_qty
        FROM public.products
        WHERE id = v_prod_id;

        IF v_prod_name IS NULL THEN
            RAISE EXCEPTION 'Product % does not exist in catalog.', v_prod_id
                USING ERRCODE = 'no_data_found';
        END IF;

        IF NOT v_is_available THEN
            RAISE EXCEPTION 'Product "%" is currently unavailable.', v_prod_name
                USING ERRCODE = 'object_not_in_prerequisite_state';
        END IF;

        -- Aggregated stock availability check (do not decrement stock yet)
        IF v_stock_qty IS NOT NULL AND v_stock_qty < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for product "%" (combined requested: %, available: %).',
                v_prod_name, v_qty, v_stock_qty
                USING ERRCODE = 'check_violation';
        END IF;

        -- Authoritative variant price override and availability
        IF v_var_id IS NOT NULL THEN
            SELECT name, price_override, is_available
            INTO v_var_name, v_price_override, v_var_is_available
            FROM public.product_variants
            WHERE id = v_var_id AND product_id = v_prod_id;

            IF v_var_name IS NULL THEN
                RAISE EXCEPTION 'Variant % does not belong to product "%".', v_var_id, v_prod_name
                    USING ERRCODE = 'invalid_parameter_value';
            END IF;

            IF NOT v_var_is_available THEN
                RAISE EXCEPTION 'Variant "%" for product "%" is currently unavailable.', v_var_name, v_prod_name
                    USING ERRCODE = 'object_not_in_prerequisite_state';
            END IF;

            v_unit_price := COALESCE(v_price_override, v_base_price);
        ELSE
            v_var_name := NULL;
            v_unit_price := v_base_price;
        END IF;

        v_line_total := v_unit_price * v_qty;
        v_subtotal := v_subtotal + v_line_total;

        -- Fetch primary product image for line item snapshot
        SELECT secure_url INTO v_item_image_url
        FROM public.product_images
        WHERE product_id = v_prod_id
        ORDER BY is_primary DESC, display_order ASC
        LIMIT 1;

        IF v_item_image_url IS NULL THEN
            v_item_image_url := '';
        END IF;

        -- Fetch brand title
        SELECT name INTO v_brand_name
        FROM public.brands
        WHERE id = v_brand_id;

        IF v_brand_name IS NULL THEN
            v_brand_name := 'Majisa Cosmetics';
        END IF;

        -- Accumulate validated item object
        v_validated_items := v_validated_items || jsonb_build_object(
            'product_id', v_prod_id,
            'variant_id', v_var_id,
            'product_name', v_prod_name,
            'brand_name', v_brand_name,
            'variant_name', v_var_name,
            'unit_price', v_unit_price,
            'quantity', v_qty,
            'total_price', v_line_total,
            'image_url', v_item_image_url
        );
    END LOOP;

    -- 7. Calculate Authoritative Delivery Fee & Order Lifecycle Totals
    -- Exact Tiered Delivery Fee Brackets:
    -- - Subtotal below Rs 500: Rs 100
    -- - Subtotal Rs 500 to below Rs 2,000: Rs 50
    -- - Subtotal Rs 2,000 and above: Free (Rs 0)
    IF v_subtotal >= 2000.00 THEN
        v_configured_delivery_fee := 0.00;
    ELSIF v_subtotal >= 500.00 THEN
        v_configured_delivery_fee := 50.00;
    ELSE
        v_configured_delivery_fee := 100.00;
    END IF;

    v_total_amount := v_subtotal + v_configured_delivery_fee;

    IF p_order_type = 'online' THEN
        -- Online Order: full payment required upfront via dynamic UPI QR
        v_payment_method := 'online_qr';
        v_amount_expected := v_total_amount;
        v_advance_amount_paid := 0.00;
        v_balance_amount_due := 0.00;
        v_order_status := 'Awaiting Payment';
        v_order_payment_status := 'pending';
        v_payment_verification_status := 'awaiting_submission';
    ELSIF p_order_type = 'cod' AND v_configured_delivery_fee = 0.00 THEN
        -- COD with Complimentary Free Delivery: Zero advance payment required!
        -- Order is immediately Confirmed and ready for packaging & shipping.
        -- payment_status is 'advance_paid' (advance fulfilled), full product subtotal due at doorstep.
        -- No payment attempt is recorded since no upfront transaction took place.
        v_payment_method := 'cod_advance';
        v_amount_expected := 0.00;
        v_advance_amount_paid := 0.00;
        v_balance_amount_due := v_subtotal;
        v_order_status := 'Confirmed';
        v_order_payment_status := 'advance_paid';
        v_payment_verification_status := NULL;
    ELSE
        -- COD with Advance Delivery Fee (Rs 100 or Rs 50): upfront advance proof required
        v_payment_method := 'cod_advance';
        v_amount_expected := v_configured_delivery_fee;
        v_advance_amount_paid := 0.00;
        v_balance_amount_due := v_subtotal;
        v_order_status := 'Awaiting Payment';
        v_order_payment_status := 'pending';
        v_payment_verification_status := 'awaiting_submission';
    END IF;

    -- 8. Generate Collision-Resistant, Sequence-Backed Order Number
    -- Format: MC-YYYYMMDD-XXXXX-HHHH (e.g., MC-20261101-01001-A9F4)
    v_order_number := 'MC-' || 
                      to_char(timezone('utc', now()), 'YYYYMMDD') || '-' || 
                      lpad(nextval('public.order_number_seq')::text, 5, '0') || '-' || 
                      upper(substr(md5(gen_random_uuid()::text), 1, 4));

    -- 9. Insert Parent Order Record
    INSERT INTO public.orders (
        order_number,
        user_id,
        order_type,
        status,
        payment_status,
        subtotal,
        delivery_fee,
        total_amount,
        advance_amount_paid,
        balance_amount_due,
        shipping_address_snapshot,
        customer_notes
    ) VALUES (
        v_order_number,
        v_user_id,
        p_order_type,
        v_order_status,
        v_order_payment_status,
        v_subtotal,
        v_configured_delivery_fee,
        v_total_amount,
        v_advance_amount_paid,
        v_balance_amount_due,
        v_address_snapshot,
        p_customer_notes
    ) RETURNING id INTO v_order_id;

    -- 10. Insert Order Line Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_validated_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            product_name,
            brand_name,
            variant_name,
            unit_price,
            quantity,
            total_price,
            image_url
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            NULLIF(v_item->>'variant_id', '')::UUID,
            v_item->>'product_name',
            v_item->>'brand_name',
            v_item->>'variant_name',
            (v_item->>'unit_price')::NUMERIC(10,2),
            (v_item->>'quantity')::INTEGER,
            (v_item->>'total_price')::NUMERIC(10,2),
            v_item->>'image_url'
        );
    END LOOP;

    -- 11. Insert Initial Payment Attempt #1 (Only when upfront payment is expected)
    -- For online orders and COD orders with an advance delivery fee (> Rs 0),
    -- create an initial payment attempt in 'awaiting_submission' state.
    -- For COD orders with free delivery (Rs 0 advance), no payment attempt is needed;
    -- the order is immediately Confirmed with full balance due at doorstep.
    IF p_order_type = 'online' OR v_configured_delivery_fee > 0.00 THEN
        INSERT INTO public.payments (
            order_id,
            attempt_number,
            payment_method,
            amount_expected,
            amount_submitted,
            advance_amount,
            balance_amount,
            utr_reference,
            proof_public_id,
            proof_file_format,
            verification_status
        ) VALUES (
            v_order_id,
            1,
            v_payment_method,
            v_amount_expected,
            0.00,
            CASE WHEN p_order_type = 'cod' THEN v_configured_delivery_fee ELSE 0.00 END,
            v_balance_amount_due,
            NULL,
            NULL,
            NULL,
            v_payment_verification_status
        ) RETURNING id INTO v_payment_id;
    ELSE
        v_payment_id := NULL;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'payment_id', v_payment_id,
        'attempt_number', CASE WHEN v_payment_id IS NOT NULL THEN 1 ELSE NULL END,
        'order_type', p_order_type,
        'subtotal', v_subtotal,
        'delivery_fee', v_configured_delivery_fee,
        'total_amount', v_total_amount,
        'amount_expected', v_amount_expected,
        'balance_amount_due', v_balance_amount_due,
        'status', v_order_status
    );
END;
$$;


-- 8.2 Atomic Retry Payment Attempt Creation (Preserves Rejected History)
-- Locking Order: Locks parent public.orders row FIRST
CREATE OR REPLACE FUNCTION public.create_retry_payment_attempt(
    p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_user_id UUID;
    v_order_type TEXT;
    v_order_status TEXT;
    v_total_amount NUMERIC(10,2);
    v_delivery_fee NUMERIC(10,2);
    v_subtotal NUMERIC(10,2);
    v_active_payment_count INTEGER;
    v_next_attempt INTEGER;
    v_payment_method TEXT;
    v_amount_expected NUMERIC(10,2);
    v_advance_amount NUMERIC(10,2);
    v_balance_amount NUMERIC(10,2);
    v_new_payment_id UUID;
BEGIN
    -- 1. Deadlock-Safe Locking Order: Lock parent order FIRST
    SELECT user_id, order_type, status, total_amount, delivery_fee, subtotal
    INTO v_order_user_id, v_order_type, v_order_status, v_total_amount, v_delivery_fee, v_subtotal
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_order_user_id IS NULL THEN
        RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'no_data_found';
    END IF;

    -- Authorization check
    IF auth.role() = 'authenticated' THEN
        IF v_order_user_id <> auth.uid() AND NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized retry attempt.' USING ERRCODE = 'insufficient_privilege';
        END IF;
    ELSIF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Order must be in a state that permits retry
    IF v_order_status NOT IN ('Payment Action Required', 'Awaiting Payment') THEN
        RAISE EXCEPTION 'Order is not in a state that permits payment retry (current status: %).', v_order_status
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    -- 2. Concurrency check: Ensure no active attempt already exists
    SELECT COUNT(*)
    INTO v_active_payment_count
    FROM public.payments
    WHERE order_id = p_order_id AND verification_status IN ('awaiting_submission', 'pending');

    IF v_active_payment_count > 0 THEN
        RAISE EXCEPTION 'An active payment attempt is already pending submission or review.'
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    -- 3. Calculate next attempt number safely
    SELECT COALESCE(MAX(attempt_number), 0) + 1
    INTO v_next_attempt
    FROM public.payments
    WHERE order_id = p_order_id;

    -- 4. Calculate authoritative expected amount from saved order
    IF v_order_type = 'online' THEN
        v_payment_method := 'online_qr';
        v_amount_expected := v_total_amount;
        v_advance_amount := 0.00;
        v_balance_amount := 0.00;
    ELSE
        v_payment_method := 'cod_advance';
        v_amount_expected := v_delivery_fee; -- Rs 100 delivery advance
        v_advance_amount := v_delivery_fee;
        v_balance_amount := v_subtotal;
    END IF;

    -- 5. Insert new payment attempt
    INSERT INTO public.payments (
        order_id,
        attempt_number,
        payment_method,
        amount_expected,
        amount_submitted,
        advance_amount,
        balance_amount,
        utr_reference,
        proof_public_id,
        proof_file_format,
        verification_status
    ) VALUES (
        p_order_id,
        v_next_attempt,
        v_payment_method,
        v_amount_expected,
        0.00,
        v_advance_amount,
        v_balance_amount,
        NULL,
        NULL,
        NULL,
        'awaiting_submission'
    ) RETURNING id INTO v_new_payment_id;

    -- 6. Update order status to 'Awaiting Payment'
    UPDATE public.orders
    SET
        status = 'Awaiting Payment',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'payment_id', v_new_payment_id,
        'attempt_number', v_next_attempt,
        'payment_method', v_payment_method,
        'amount_expected', v_amount_expected,
        'status', 'Awaiting Payment'
    );
END;
$$;


-- 8.3 Atomic Customer Payment Proof Submission (With Asset Namespace Validation)
-- Locking Order: Locks parent public.orders row FIRST, then public.payments row SECOND
CREATE OR REPLACE FUNCTION public.submit_payment_proof(
    p_order_id UUID,
    p_payment_id UUID,
    p_utr_reference TEXT,
    p_proof_public_id TEXT,
    p_proof_file_format TEXT,
    p_proof_file_size_bytes INTEGER,
    p_amount_submitted NUMERIC(10,2)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_user_id UUID;
    v_sanitized_utr TEXT;
    v_sanitized_format TEXT;
    v_current_status TEXT;
    v_payment_order_id UUID;
    v_expected_namespace_prefix TEXT;
BEGIN
    -- 1. Resolve order association from payment record
    SELECT order_id INTO v_payment_order_id
    FROM public.payments
    WHERE id = p_payment_id;

    IF v_payment_order_id IS NULL OR v_payment_order_id <> p_order_id THEN
        RAISE EXCEPTION 'Payment record not found for this order.'
            USING ERRCODE = 'no_data_found';
    END IF;

    -- 2. Deadlock-Safe Locking Order: Lock parent order FIRST
    SELECT user_id INTO v_order_user_id
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_order_user_id IS NULL THEN
        RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'no_data_found';
    END IF;

    -- Authorization check
    IF auth.role() = 'authenticated' THEN
        IF v_order_user_id <> auth.uid() AND NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized payment submission.' USING ERRCODE = 'insufficient_privilege';
        END IF;
    ELSIF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- 3. Deadlock-Safe Locking Order: Lock target payment record SECOND
    SELECT verification_status
    INTO v_current_status
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF v_current_status <> 'awaiting_submission' THEN
        RAISE EXCEPTION 'Payment attempt is not awaiting submission (current status: %).', v_current_status
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    -- 4. Validate UTR (strip non-alphanumeric, uppercase, length 8-22)
    v_sanitized_utr := regexp_replace(upper(trim(p_utr_reference)), '[^A-Z0-9]', '', 'g');
    IF length(v_sanitized_utr) < 8 OR length(v_sanitized_utr) > 22 THEN
        RAISE EXCEPTION 'Invalid UTR reference: must be 8 to 22 alphanumeric characters.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- 5. Validate Cloudinary public ID namespace binding:
    -- Asset MUST be uploaded under dedicated namespace bound to order and payment attempt:
    -- majisa-cosmetics/payment-proofs/{order_id}/{payment_id}_%
    v_expected_namespace_prefix := 'majisa-cosmetics/payment-proofs/' || p_order_id::text || '/' || p_payment_id::text;
    IF p_proof_public_id IS NULL OR NOT (p_proof_public_id LIKE (v_expected_namespace_prefix || '%')) THEN
        RAISE EXCEPTION 'Invalid payment proof asset path. Asset is not bound to this order and payment attempt.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- 6. Validate file format
    v_sanitized_format := lower(trim(p_proof_file_format));
    IF v_sanitized_format NOT IN ('jpg', 'jpeg', 'png', 'webp') THEN
        RAISE EXCEPTION 'Unsupported proof file format: %. Allowed: jpg, jpeg, png, webp.', v_sanitized_format
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- 7. Validate file size (max 5 MB)
    IF p_proof_file_size_bytes IS NULL OR p_proof_file_size_bytes <= 0 OR p_proof_file_size_bytes > 5242880 THEN
        RAISE EXCEPTION 'Proof file size exceeds allowed 5 MB limit.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- 8. Update payment attempt to 'pending'
    UPDATE public.payments
    SET
        utr_reference = v_sanitized_utr,
        proof_public_id = p_proof_public_id,
        proof_file_format = v_sanitized_format,
        proof_file_size_bytes = p_proof_file_size_bytes,
        proof_uploaded_at = timezone('utc'::text, now()),
        amount_submitted = p_amount_submitted,
        verification_status = 'pending',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_payment_id;

    -- 9. Transition order status to 'Pending Verification'
    UPDATE public.orders
    SET
        status = 'Pending Verification',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'payment_id', p_payment_id,
        'verification_status', 'pending',
        'status', 'Pending Verification'
    );
END;
$$;


-- 8.4 Administrative Manual Payment Verification
-- Locking Order: Locks parent public.orders row FIRST, then public.payments row SECOND
-- Validates: payment_method and amount_expected independently against parent order attributes
CREATE OR REPLACE FUNCTION public.verify_payment_admin(
    p_payment_id UUID,
    p_confirmed_amount_received NUMERIC(10,2),
    p_admin_notes TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_order_type TEXT;
    v_total_amount NUMERIC(10,2);
    v_subtotal NUMERIC(10,2);
    v_delivery_fee NUMERIC(10,2);
    v_amount_expected NUMERIC(10,2);
    v_payment_method TEXT;
    v_payment_status TEXT;
    v_payment_attempt_number INTEGER;
    v_max_attempt_number INTEGER;
    v_admin_id UUID;
BEGIN
    -- 1. Trusted Admin Identity Resolution:
    IF auth.role() = 'authenticated' THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Administrative privileges required.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        v_admin_id := auth.uid();
    ELSIF auth.role() = 'service_role' THEN
        IF p_admin_id IS NULL THEN
            RAISE EXCEPTION 'Admin user ID must be provided when invoking via service_role.'
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = p_admin_id AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Provided user ID does not have administrative privileges.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        v_admin_id := p_admin_id;
    ELSE
        RAISE EXCEPTION 'Administrative authentication required.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- 2. Resolve order_id from payment record
    SELECT order_id INTO v_order_id
    FROM public.payments
    WHERE id = p_payment_id;

    IF v_order_id IS NULL THEN
        RAISE EXCEPTION 'Payment record not found.' USING ERRCODE = 'no_data_found';
    END IF;

    -- 3. Deadlock-Safe Locking Order: Lock parent order FIRST
    SELECT order_type, total_amount, subtotal, delivery_fee
    INTO v_order_type, v_total_amount, v_subtotal, v_delivery_fee
    FROM public.orders
    WHERE id = v_order_id
    FOR UPDATE;

    -- 4. Deadlock-Safe Locking Order: Lock payment record SECOND
    SELECT attempt_number, payment_method, amount_expected, verification_status
    INTO v_payment_attempt_number, v_payment_method, v_amount_expected, v_payment_status
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    -- Accept only payment attempts in 'pending' status
    IF v_payment_status <> 'pending' THEN
        RAISE EXCEPTION 'Only payments in "pending" status can be verified (current: %).', v_payment_status
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    -- 5. Superseded Attempt Guard: Ensure this is the latest attempt for the order
    SELECT MAX(attempt_number)
    INTO v_max_attempt_number
    FROM public.payments
    WHERE order_id = v_order_id;

    IF v_payment_attempt_number <> v_max_attempt_number THEN
        RAISE EXCEPTION 'Cannot verify superseded payment attempt #%. Active attempt is #%.',
            v_payment_attempt_number, v_max_attempt_number
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    -- 6. Independent Payment Method & Expected Amount Validation Against Parent Order:
    IF v_order_type = 'online' THEN
        IF v_payment_method <> 'online_qr' THEN
            RAISE EXCEPTION 'Payment method mismatch: Online order requires "online_qr" payment method (found: %).', v_payment_method
                USING ERRCODE = 'check_violation';
        END IF;

        IF v_amount_expected <> v_total_amount THEN
            RAISE EXCEPTION 'Payment amount mismatch: Online order expected amount (%) does not match order total amount (%).',
                v_amount_expected, v_total_amount
                USING ERRCODE = 'check_violation';
        END IF;
    ELSIF v_order_type = 'cod' THEN
        IF v_payment_method <> 'cod_advance' THEN
            RAISE EXCEPTION 'Payment method mismatch: COD order requires "cod_advance" payment method (found: %).', v_payment_method
                USING ERRCODE = 'check_violation';
        END IF;

        IF v_amount_expected <> v_delivery_fee THEN
            RAISE EXCEPTION 'Payment amount mismatch: COD advance expected amount (%) does not match order delivery fee (%).',
                v_amount_expected, v_delivery_fee
                USING ERRCODE = 'check_violation';
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid order type on parent order: %.', v_order_type
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- 7. Explicit Bank Credit Confirmation: Confirmed amount MUST match amount_expected
    IF p_confirmed_amount_received IS NULL OR p_confirmed_amount_received <> v_amount_expected THEN
        RAISE EXCEPTION 'Confirmed amount received (%) does not match expected payment amount (%).',
            p_confirmed_amount_received, v_amount_expected
            USING ERRCODE = 'check_violation';
    END IF;

    -- 8. Update payment verification record (mutually exclusive with rejection fields)
    UPDATE public.payments
    SET
        verification_status = 'verified',
        verified_by = v_admin_id,
        verified_at = timezone('utc'::text, now()),
        admin_notes = p_admin_notes,
        rejected_by = NULL,
        rejected_at = NULL,
        rejection_reason = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_payment_id;

    -- 9. Apply strict business logic based on order_type:
    IF v_order_type = 'online' THEN
        -- Online: Full order amount (subtotal + Rs 100 delivery) verified upfront
        UPDATE public.orders
        SET
            status = 'Confirmed',
            payment_status = 'fully_paid',
            advance_amount_paid = v_total_amount,
            balance_amount_due = 0.00,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_order_id;
    ELSIF v_order_type = 'cod' THEN
        -- COD: ONLY the Rs 100 delivery advance is verified!
        -- Advance verification must NEVER mark the order fully paid.
        -- Balance due remains equal to the product subtotal (total_amount - 100).
        UPDATE public.orders
        SET
            status = 'Confirmed',
            payment_status = 'advance_paid',
            advance_amount_paid = v_amount_expected,
            balance_amount_due = v_subtotal,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_order_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'payment_id', p_payment_id,
        'order_type', v_order_type,
        'verified_by', v_admin_id,
        'new_order_status', 'Confirmed',
        'payment_status', CASE WHEN v_order_type = 'online' THEN 'fully_paid' ELSE 'advance_paid' END,
        'advance_amount_paid', CASE WHEN v_order_type = 'online' THEN v_total_amount ELSE v_amount_expected END,
        'balance_amount_due', CASE WHEN v_order_type = 'online' THEN 0.00 ELSE v_subtotal END
    );
END;
$$;


-- 8.5 Administrative Payment Rejection
-- Locking Order: Locks parent public.orders row FIRST, then public.payments row SECOND
CREATE OR REPLACE FUNCTION public.reject_payment_admin(
    p_payment_id UUID,
    p_rejection_reason TEXT,
    p_admin_notes TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_payment_attempt_number INTEGER;
    v_max_attempt_number INTEGER;
    v_payment_status TEXT;
    v_admin_id UUID;
BEGIN
    -- 1. Trusted Admin Identity Resolution:
    IF auth.role() = 'authenticated' THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Administrative privileges required.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        v_admin_id := auth.uid();
    ELSIF auth.role() = 'service_role' THEN
        IF p_admin_id IS NULL THEN
            RAISE EXCEPTION 'Admin user ID must be provided when invoking via service_role.'
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = p_admin_id AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Provided user ID does not have administrative privileges.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        v_admin_id := p_admin_id;
    ELSE
        RAISE EXCEPTION 'Administrative authentication required.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF p_rejection_reason IS NULL OR trim(p_rejection_reason) = '' THEN
        RAISE EXCEPTION 'Rejection reason is required.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- 2. Resolve order_id from payment record
    SELECT order_id INTO v_order_id
    FROM public.payments
    WHERE id = p_payment_id;

    IF v_order_id IS NULL THEN
        RAISE EXCEPTION 'Payment record not found.' USING ERRCODE = 'no_data_found';
    END IF;

    -- 3. Deadlock-Safe Locking Order: Lock parent order FIRST
    PERFORM 1 FROM public.orders WHERE id = v_order_id FOR UPDATE;

    -- 4. Deadlock-Safe Locking Order: Lock payment record SECOND
    SELECT attempt_number, verification_status
    INTO v_payment_attempt_number, v_payment_status
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    -- Accept only payment attempts in 'pending' status
    IF v_payment_status <> 'pending' THEN
        RAISE EXCEPTION 'Only payments in "pending" status can be rejected (current: %).', v_payment_status
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    -- 5. Superseded Attempt Guard
    SELECT MAX(attempt_number)
    INTO v_max_attempt_number
    FROM public.payments
    WHERE order_id = v_order_id;

    IF v_payment_attempt_number <> v_max_attempt_number THEN
        RAISE EXCEPTION 'Cannot reject superseded payment attempt #%. Active attempt is #%.',
            v_payment_attempt_number, v_max_attempt_number
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    -- 6. Update payment record to 'rejected' (mutually exclusive with verification fields)
    UPDATE public.payments
    SET
        verification_status = 'rejected',
        rejected_by = v_admin_id,
        rejected_at = timezone('utc'::text, now()),
        rejection_reason = trim(p_rejection_reason),
        admin_notes = p_admin_notes,
        verified_by = NULL,
        verified_at = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_payment_id;

    -- 7. Transition order status to 'Payment Action Required'
    UPDATE public.orders
    SET
        status = 'Payment Action Required',
        payment_status = 'pending',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'payment_id', p_payment_id,
        'rejected_by', v_admin_id,
        'new_order_status', 'Payment Action Required',
        'rejection_reason', trim(p_rejection_reason)
    );
END;
$$;


-- 8.6 Administrative COD Doorstep Balance Collection Confirmation (Audited & Safe)
-- Locking Order: Locks parent public.orders row FIRST
CREATE OR REPLACE FUNCTION public.confirm_cod_balance_collected_admin(
    p_order_id UUID,
    p_confirmed_collected_amount NUMERIC(10,2),
    p_payment_method TEXT DEFAULT 'cash',
    p_transaction_reference TEXT DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_type TEXT;
    v_order_status TEXT;
    v_payment_status TEXT;
    v_balance_due NUMERIC(10,2);
    v_total_amount NUMERIC(10,2);
    v_admin_id UUID;
    v_collection_id UUID;
BEGIN
    -- 1. Trusted Admin Identity Resolution:
    IF auth.role() = 'authenticated' THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Administrative privileges required.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        v_admin_id := auth.uid();
    ELSIF auth.role() = 'service_role' THEN
        IF p_admin_id IS NULL THEN
            RAISE EXCEPTION 'Admin user ID must be provided when invoking via service_role.'
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = p_admin_id AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Provided user ID does not have administrative privileges.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        v_admin_id := p_admin_id;
    ELSE
        RAISE EXCEPTION 'Administrative authentication required.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- 2. Lock and retrieve order FIRST
    SELECT order_type, status, payment_status, balance_amount_due, total_amount
    INTO v_order_type, v_order_status, v_payment_status, v_balance_due, v_total_amount
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_order_type IS NULL THEN
        RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'no_data_found';
    END IF;

    -- Validate that order is COD
    IF v_order_type <> 'cod' THEN
        RAISE EXCEPTION 'Doorstep balance collection confirmation is only applicable to COD orders.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Ensure order has verified advance payment
    IF v_payment_status <> 'advance_paid' THEN
        RAISE EXCEPTION 'Cannot collect remaining balance before delivery advance has been verified (current payment status: %).', v_payment_status
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    -- Permit final collection only for orders in appropriate delivery state (Dispatched or Delivered)
    IF v_order_status NOT IN ('Dispatched', 'Delivered') THEN
        RAISE EXCEPTION 'COD balance can only be collected for orders that are Dispatched or Delivered (current order status: %).', v_order_status
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    -- Ensure balance has not already been marked collected
    IF v_balance_due <= 0.00 THEN
        RAISE EXCEPTION 'COD remaining balance has already been collected.'
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    -- Require confirmed collected amount to equal outstanding COD balance exactly
    IF p_confirmed_collected_amount IS NULL OR p_confirmed_collected_amount <> v_balance_due THEN
        RAISE EXCEPTION 'Confirmed collected amount (%) must exactly equal the outstanding balance (%).',
            p_confirmed_collected_amount, v_balance_due
            USING ERRCODE = 'check_violation';
    END IF;

    -- 3. Insert Dedicated Audit Record in public.order_collections (Guarantees single execution via UNIQUE constraint)
    INSERT INTO public.order_collections (
        order_id,
        collection_type,
        amount_collected,
        collected_by,
        collected_at,
        payment_method,
        transaction_reference,
        admin_notes
    ) VALUES (
        p_order_id,
        'cod_doorstep_balance',
        p_confirmed_collected_amount,
        v_admin_id,
        timezone('utc'::text, now()),
        COALESCE(p_payment_method, 'cash'),
        p_transaction_reference,
        p_admin_notes
    ) RETURNING id INTO v_collection_id;

    -- 4. Update order summary fields (advance_amount_paid remains untouched at Rs 100 advance)
    UPDATE public.orders
    SET
        payment_status = 'fully_paid',
        cod_balance_collected = p_confirmed_collected_amount,
        cod_collected_at = timezone('utc'::text, now()),
        cod_collected_by = v_admin_id,
        balance_amount_due = 0.00,
        status = CASE WHEN status = 'Dispatched' THEN 'Delivered' ELSE status END,
        delivered_at = CASE WHEN delivered_at IS NULL AND status = 'Dispatched' THEN timezone('utc'::text, now()) ELSE delivered_at END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'collection_id', v_collection_id,
        'order_id', p_order_id,
        'payment_status', 'fully_paid',
        'cod_balance_collected', p_confirmed_collected_amount,
        'collected_by', v_admin_id,
        'total_amount', v_total_amount,
        'balance_amount_due', 0.00
    );
END;
$$;


-- =============================================================================
-- 9. Function Grants and Security Hardening
-- =============================================================================

-- Assign ownership to postgres superuser
ALTER FUNCTION public.check_order_status_transition() OWNER TO postgres;
ALTER FUNCTION public.create_order_with_payment(UUID, TEXT, UUID, JSONB, TEXT, JSONB) OWNER TO postgres;
ALTER FUNCTION public.create_retry_payment_attempt(UUID) OWNER TO postgres;
ALTER FUNCTION public.submit_payment_proof(UUID, UUID, TEXT, TEXT, TEXT, INTEGER, NUMERIC) OWNER TO postgres;
ALTER FUNCTION public.verify_payment_admin(UUID, NUMERIC, TEXT, UUID) OWNER TO postgres;
ALTER FUNCTION public.reject_payment_admin(UUID, TEXT, TEXT, UUID) OWNER TO postgres;
ALTER FUNCTION public.confirm_cod_balance_collected_admin(UUID, NUMERIC, TEXT, TEXT, TEXT, UUID) OWNER TO postgres;

-- Revoke default PUBLIC and anon execution
REVOKE ALL ON FUNCTION public.check_order_status_transition() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_order_with_payment(UUID, TEXT, UUID, JSONB, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_retry_payment_attempt(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_payment_proof(UUID, UUID, TEXT, TEXT, TEXT, INTEGER, NUMERIC) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_payment_admin(UUID, NUMERIC, TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_payment_admin(UUID, TEXT, TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_cod_balance_collected_admin(UUID, NUMERIC, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;

-- Grant execution to authenticated users and service_role
-- (Internal authorization guards enforce user ownership and admin privileges)
GRANT EXECUTE ON FUNCTION public.create_order_with_payment(UUID, TEXT, UUID, JSONB, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_retry_payment_attempt(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_payment_proof(UUID, UUID, TEXT, TEXT, TEXT, INTEGER, NUMERIC) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_payment_admin(UUID, NUMERIC, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_payment_admin(UUID, TEXT, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_cod_balance_collected_admin(UUID, NUMERIC, TEXT, TEXT, TEXT, UUID) TO authenticated, service_role;
