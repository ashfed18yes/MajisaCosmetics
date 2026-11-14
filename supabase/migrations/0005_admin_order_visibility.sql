-- =============================================================================
-- Migration: 0005_admin_order_visibility.sql
-- Module: Admin Order Visibility & Abandoned Checkout Isolation
-- Project: Majisa Cosmetics E-Commerce Platform
-- Author: Platform Engineering
-- =============================================================================
--
-- BUSINESS RULES & ARCHITECTURAL INVARIANTS:
-- 1. Cart Isolation:
--    Adding items to bag remains strictly client-side in localStorage/React context.
--    No database rows are created until checkout initiation.
--
-- 2. Online & COD (Delivery Fee) Order Lifecycle:
--    - When a customer clicks "Place Order" and generates a UPI QR, an order row is
--      initialized in 'Awaiting Payment' state with a collision-resistant order number.
--    - Orders in 'Awaiting Payment' are DRAFT / UNSUBMITTED attempts.
--    - They MUST NEVER appear in Admin Online Orders (/admin/orders/online),
--      Admin COD Orders (/admin/orders/cod), Admin Order Details (/admin/orders/[id]),
--      or Admin Dashboard KPI counters/revenue metrics.
--    - Admin Notification Bell MUST NOT notify on 'Awaiting Payment' order insertion.
--    - When customer submits UTR & screenshot, submit_payment_proof atomically transitions
--      the order status to 'Pending Verification'. The order becomes Admin-visible at that exact moment.
--
-- 3. COD with Free Delivery (Subtotal >= ₹2,000 / Delivery Fee = ₹0):
--    - No upfront advance is required.
--    - Checkout initiates the order directly in 'Confirmed' status with payment_status = 'advance_paid'.
--    - No pseudo payment record is inserted into public.payments.
--    - It is Admin-visible immediately upon checkout submission.
--    - Full subtotal remains due at doorstep delivery.
--
-- 4. Payment Rejections & Retry History:
--    - When admin rejects proof ('Payment Action Required'), order remains Admin-visible.
--    - Customer can retry via create_retry_payment_attempt.
--    - Rejected payment attempt history is preserved with audit timestamps.
--
-- =============================================================================

-- 1. Partial Performance Indexes for Admin Visibility Filtering
-- Optimize queries where status <> 'Awaiting Payment'

CREATE INDEX IF NOT EXISTS idx_orders_admin_visible_online
    ON public.orders (created_at DESC, id DESC)
    WHERE order_type = 'online' AND status <> 'Awaiting Payment';

CREATE INDEX IF NOT EXISTS idx_orders_admin_visible_cod
    ON public.orders (created_at DESC, id DESC)
    WHERE order_type = 'cod' AND status <> 'Awaiting Payment';

CREATE INDEX IF NOT EXISTS idx_orders_admin_dashboard_kpis
    ON public.orders (status, order_type, created_at DESC)
    WHERE status <> 'Awaiting Payment';

-- 2. Automated / Scheduled Cleanup RPC for Abandoned Checkout Drafts
-- Safely transitions unsubmitted 'Awaiting Payment' drafts older than threshold to 'Cancelled'

CREATE OR REPLACE FUNCTION public.cancel_abandoned_awaiting_payment_orders(
    p_older_than_interval INTERVAL DEFAULT INTERVAL '24 hours'
)
RETURNS TABLE (
    cancelled_orders_count INTEGER,
    cancelled_order_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ids UUID[];
    v_count INTEGER := 0;
BEGIN
    -- Security guard: Must be executed by admin or service_role
    IF auth.role() = 'authenticated' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only platform administrators can perform batch cleanup of abandoned orders.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Select and lock stale awaiting payment orders
    SELECT array_agg(id)
    INTO v_ids
    FROM public.orders
    WHERE status = 'Awaiting Payment'
      AND created_at < (timezone('utc', now()) - p_older_than_interval)
    FOR UPDATE SKIP LOCKED;

    IF v_ids IS NOT NULL AND array_length(v_ids, 1) > 0 THEN
        UPDATE public.orders
        SET
            status = 'Cancelled',
            cancelled_at = timezone('utc', now()),
            customer_notes = COALESCE(customer_notes || ' | ', '') || 'System: Checkout draft expired (payment proof not submitted within allowed window).',
            updated_at = timezone('utc', now())
        WHERE id = ANY(v_ids);

        GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;

    RETURN QUERY SELECT v_count, COALESCE(v_ids, ARRAY[]::UUID[]);
END;
$$;

-- Function ownership and permissions
ALTER FUNCTION public.cancel_abandoned_awaiting_payment_orders(INTERVAL) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.cancel_abandoned_awaiting_payment_orders(INTERVAL) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_abandoned_awaiting_payment_orders(INTERVAL) TO authenticated, service_role;

COMMENT ON FUNCTION public.cancel_abandoned_awaiting_payment_orders(INTERVAL) IS
    'Administrative cleanup utility to transition stale unsubmitted checkout drafts in Awaiting Payment state to Cancelled.';

