-- Migration: add deposit_usdc transaction type
-- Created: 2026-04-14

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
    CHECK (type IN (
      'buy_gold',
      'gift_sent',
      'gift_received',
      'allocate_to_piggy',
      'withdraw_from_piggy',
      'withdraw_usdc',
      'deposit_usdc'
    ));
