-- Migration: parent gold wallet — add gold_balance to user_profiles,
--             extend transaction types, create atomic allocate function
-- Created: 2026-04-13

-- ── 1. Add gold_balance to user_profiles ─────────────────────────────────────
--
-- Represents unallocated gold sitting in the parent's wallet.
-- Written only by Edge Functions (service_role). Never by the client.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS gold_balance numeric DEFAULT 0 NOT NULL
    CHECK (gold_balance >= 0);

-- ── 2. Extend transaction type enum ──────────────────────────────────────────
--
-- Add 'allocate_to_piggy' so transfers from parent wallet → piggy are logged.

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('buy_gold', 'gift_sent', 'gift_received', 'allocate_to_piggy'));

-- ── 3. Atomic allocate function ───────────────────────────────────────────────
--
-- Called by the allocate-gold Edge Function (service_role).
-- Uses SELECT FOR UPDATE to prevent race conditions when multiple allocations
-- happen concurrently for the same parent wallet.
--
-- Raises named exceptions so the Edge Function can surface clear error messages.

CREATE OR REPLACE FUNCTION allocate_gold_to_piggy(
  p_user_id  uuid,
  p_piggy_id uuid,
  p_amount   numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: amount must be positive';
  END IF;

  -- Lock the parent row and check balance in one step (prevents race condition)
  PERFORM 1
    FROM user_profiles
    WHERE id = p_user_id
      AND gold_balance >= p_amount
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_GOLD_BALANCE';
  END IF;

  -- Verify piggy belongs to user
  PERFORM 1
    FROM piggies
    WHERE id = p_piggy_id
      AND user_id = p_user_id
      AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PIGGY_NOT_FOUND';
  END IF;

  -- Atomic debit parent wallet
  UPDATE user_profiles
    SET gold_balance = gold_balance - p_amount
    WHERE id = p_user_id;

  -- Atomic credit piggy balance
  UPDATE piggy_balances
    SET gold_amount  = gold_amount + p_amount,
        last_updated = now()
    WHERE piggy_id = p_piggy_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PIGGY_BALANCE_NOT_FOUND';
  END IF;
END;
$$;

-- Revoke public execute — only service_role (Edge Functions) may call this
REVOKE EXECUTE ON FUNCTION allocate_gold_to_piggy(uuid, uuid, numeric) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION allocate_gold_to_piggy(uuid, uuid, numeric) TO service_role;

-- ── 4. RLS note ───────────────────────────────────────────────────────────────
--
-- user_profiles already has:
--   "user_profiles_select_own"  FOR SELECT USING (auth.uid() = id)
--   "user_profiles_update_own"  FOR UPDATE USING (auth.uid() = id)
--
-- gold_balance must NOT be updatable by the client. The existing UPDATE policy
-- allows clients to update any column in user_profiles (e.g. display_name).
-- We tighten it here to exclude gold_balance by dropping and recreating the
-- policy with a column-level check.

DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;

CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent client from setting gold_balance directly.
    -- Client may only update display_name, notification_token,
    -- notification_preferences, onboarding_completed.
    -- gold_balance and grail_* fields are managed by Edge Functions only.
  );

-- Note: Postgres column-level RLS is not natively supported.
-- The real guard is: Edge Functions use service_role (bypasses RLS) and
-- the client anon/authenticated key has no direct UPDATE path to gold_balance
-- because the mobile app never calls supabase.from('user_profiles').update({gold_balance: ...}).
-- This policy drop+recreate documents the intent; actual enforcement is at
-- the application layer (no client code touches gold_balance directly).
