-- ============================================================
-- Migration: increment_piggy_balance RPC function
-- Needed by: buy-gold, claim-gift Edge Functions
-- Created: 2026-04-10
-- ============================================================

-- Atomic increment of piggy gold balance.
-- Using a dedicated function prevents race conditions on concurrent updates.
-- This function runs with SECURITY DEFINER so Edge Functions (via service_role)
-- can call it without bypassing the positive-balance check.
CREATE OR REPLACE FUNCTION increment_piggy_balance(
  p_piggy_id    uuid,
  p_gold_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE piggy_balances
  SET
    gold_amount  = gold_amount + p_gold_amount,
    last_updated = now()
  WHERE
    piggy_id = p_piggy_id
    AND gold_amount + p_gold_amount >= 0; -- Safety: never go below zero

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Piggy balance not found or balance would go negative: piggy_id=%, amount=%',
      p_piggy_id, p_gold_amount;
  END IF;
END;
$$;

-- Revoke direct client access — only service_role / Edge Functions can call this
REVOKE EXECUTE ON FUNCTION increment_piggy_balance FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_piggy_balance FROM anon;
REVOKE EXECUTE ON FUNCTION increment_piggy_balance FROM authenticated;
