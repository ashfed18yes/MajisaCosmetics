-- =============================================================================
-- Migration: 0002_security_hardening.sql
-- Description: Security Remediation Phase 1
--   - H-01: Restrict customer profile updates to permitted columns only
--   - H-02: Enforce concurrency-safe maximum 15 saved addresses per customer
-- =============================================================================

-- =============================================================================
-- 1. H-01: Column-Level UPDATE Permissions on Profiles
-- =============================================================================

-- Revoke broad table-level UPDATE privilege from authenticated role
REVOKE UPDATE ON public.profiles FROM authenticated;

-- Grant column-level UPDATE strictly on customer-modifiable fields
GRANT UPDATE (full_name, phone, avatar_public_id, avatar_url) ON public.profiles TO authenticated;


-- =============================================================================
-- 2. H-02: Concurrency-Safe Saved Address Quota (Max 15 per Customer)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_user_address_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Concurrency Guard: Lock the parent profile row exclusively for the duration of this transaction.
    -- This serializes concurrent address inserts for the same user without locking other users' records.
    PERFORM 1
    FROM public.profiles
    WHERE id = NEW.user_id
    FOR UPDATE;

    -- Query the committed count for this user
    SELECT COUNT(*)
    INTO current_count
    FROM public.addresses
    WHERE user_id = NEW.user_id;

    -- Enforce maximum quota of 15 saved addresses
    IF current_count >= 15 THEN
        RAISE EXCEPTION 'Maximum address limit reached. You cannot save more than 15 delivery addresses.'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

-- Explicitly assign function ownership to the Supabase administrative role
ALTER FUNCTION public.check_user_address_limit() OWNER TO postgres;

-- Revoke direct execution access to prevent unauthenticated or RPC invocation
REVOKE ALL ON FUNCTION public.check_user_address_limit() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_user_address_limit() FROM anon;
REVOKE ALL ON FUNCTION public.check_user_address_limit() FROM authenticated;

DROP TRIGGER IF EXISTS trg_check_user_address_limit ON public.addresses;
CREATE TRIGGER trg_check_user_address_limit
    BEFORE INSERT ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.check_user_address_limit();
