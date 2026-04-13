-- Migration: withdraw from piggy — add new transaction type and RPC
-- Created: 2026-04-13

-- ── 1. Extend transaction type enum ──────────────────────────────────────────
-- Add 'withdraw_from_piggy' to the check constraint
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('buy_gold', 'gift_sent', 'gift_received', 'allocate_to_piggy', 'withdraw_from_piggy', 'withdraw_usdc'));

-- ── 2. Atomic withdraw function ──────────────────────────────────────────────
-- Move gold from a piggy back into the parent wallet.
-- Called by the withdraw-from-piggy Edge Function (service_role).

CREATE OR REPLACE FUNCTION withdraw_gold_from_piggy(
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

  -- Lock the piggy balance row and check if enough gold exists
  PERFORM 1
    FROM piggy_balances
    WHERE piggy_id = p_piggy_id
      AND gold_amount >= p_amount
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_PIGGY_BALANCE';
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

  -- Atomic debit piggy balance
  UPDATE piggy_balances
    SET gold_amount  = gold_amount - p_amount,
        last_updated = now()
    WHERE piggy_id = p_piggy_id;

  -- Atomic credit parent wallet
  UPDATE user_profiles
    SET gold_balance = gold_balance + p_amount
    WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_PROFILE_NOT_FOUND';
  END IF;
END;
$$;

-- Revoke public execute — only service_role (Edge Functions) may call this
REVOKE EXECUTE ON FUNCTION withdraw_gold_from_piggy(uuid, uuid, numeric) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION withdraw_gold_from_piggy(uuid, uuid, numeric) TO service_role;
