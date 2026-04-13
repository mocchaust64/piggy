-- Migration: Add recipient identifier fields to gifts table
-- Allows sending gifts to external recipients (email/phone/wallet)
-- without requiring an existing piggy bank on the sender's side.
-- Created: 2026-04-14

-- ── 1. Allow to_piggy_id to be null ───────────────────────────────────────────
-- Previously non-null because gifts required a sender's piggy.
-- Now the recipient chooses their own piggy at claim time.
ALTER TABLE gifts ALTER COLUMN to_piggy_id DROP NOT NULL;

-- ── 2. Add recipient metadata ─────────────────────────────────────────────────
ALTER TABLE gifts
  ADD COLUMN IF NOT EXISTS recipient_identifier text,
  ADD COLUMN IF NOT EXISTS recipient_type text
    CHECK (recipient_type IN ('email', 'phone', 'wallet'));

-- ── 3. Index for lookup ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_gifts_recipient
  ON gifts (recipient_identifier)
  WHERE recipient_identifier IS NOT NULL;
