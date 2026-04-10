-- ============================================================
-- Vàng Heo Đất — Initial Schema
-- Created: 2026-04-10
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tables ──────────────────────────────────────────────────────────────────

-- User profiles (Supabase auth.users không lưu app-specific data)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  grail_user_id text,                   -- GRAIL custodial user reference
  grail_deposit_address text,           -- địa chỉ nạp USDC
  grail_usdc_balance numeric DEFAULT 0, -- cache từ GRAIL, sync khi mở app
  notification_token text,
  notification_preferences jsonb DEFAULT '{"gifts": true, "priceAlerts": false}'::jsonb,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Piggies (heo đất của trẻ em)
CREATE TABLE piggies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  child_name text NOT NULL,
  avatar_url text,
  target_amount numeric CHECK (target_amount > 0),
  target_description text,
  deleted_at timestamptz,               -- soft delete
  last_synced_at timestamptz,           -- lần cuối sync balance với GRAIL
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Số dư vàng của mỗi heo
CREATE TABLE piggy_balances (
  piggy_id uuid PRIMARY KEY REFERENCES piggies ON DELETE CASCADE,
  gold_amount numeric DEFAULT 0 NOT NULL CHECK (gold_amount >= 0),
  grail_wallet_id text,                 -- GRAIL sub-wallet ID (nếu Oro hỗ trợ)
  last_updated timestamptz DEFAULT now() NOT NULL
);

-- Quà tặng
CREATE TABLE gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users ON DELETE SET NULL NOT NULL,
  to_piggy_id uuid REFERENCES piggies ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  message text,
  template_type text CHECK (template_type IN ('tet', 'sinhnhat', 'cuoihoi', 'thoinhoi')),
  claim_code text UNIQUE NOT NULL,      -- format: 'heo-[nanoid(10)]'
  status text DEFAULT 'pending' NOT NULL
    CHECK (status IN ('pending', 'transfer_in_progress', 'claimed', 'failed', 'expired', 'cancelled_by_sender')),
  recipient_user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  grail_tx_reference text,
  claim_attempts integer DEFAULT 0 NOT NULL,
  expires_at timestamptz NOT NULL,      -- 30 ngày từ ngày tạo
  claimed_at timestamptz,
  cancelled_at timestamptz,
  sender_notified boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Lịch sử giao dịch
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL NOT NULL,
  piggy_id uuid REFERENCES piggies ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('buy_gold', 'gift_sent', 'gift_received')),
  amount numeric NOT NULL CHECK (amount > 0),  -- gold amount (grams)
  usdc_amount numeric CHECK (usdc_amount >= 0),
  gold_price_at_time numeric,
  fee_amount numeric DEFAULT 0,
  grail_tx_reference text,
  status text DEFAULT 'pending' NOT NULL
    CHECK (status IN ('pending', 'completed', 'failed')),
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Audit log cho gift claims (security + compliance)
CREATE TABLE gift_claim_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id uuid REFERENCES gifts ON DELETE SET NULL,
  attempted_by_user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  result text NOT NULL
    CHECK (result IN ('success', 'already_claimed', 'expired', 'invalid_code', 'in_progress', 'rate_limited')),
  attempted_at timestamptz DEFAULT now() NOT NULL
);

-- Cache giá vàng (TTL 10 phút, managed by Edge Function)
CREATE TABLE price_cache (
  id text PRIMARY KEY,                  -- 'gold_price_current' | 'gold_price_7d' | 'gold_price_30d'
  data jsonb NOT NULL,
  cached_at timestamptz DEFAULT now() NOT NULL
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_piggies_user_id ON piggies (user_id);
CREATE INDEX idx_piggies_active ON piggies (user_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_gifts_claim_code ON gifts (claim_code);
CREATE INDEX idx_gifts_from_user_id ON gifts (from_user_id);
CREATE INDEX idx_gifts_to_piggy_id ON gifts (to_piggy_id);
CREATE INDEX idx_gifts_pending ON gifts (expires_at) WHERE status = 'pending';

CREATE INDEX idx_transactions_user_id ON transactions (user_id);
CREATE INDEX idx_transactions_piggy_id ON transactions (piggy_id);
CREATE INDEX idx_transactions_grail_ref ON transactions (grail_tx_reference);
CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);

CREATE INDEX idx_gift_claim_audit_gift_id ON gift_claim_audit (gift_id);
CREATE INDEX idx_gift_claim_audit_rate_limit ON gift_claim_audit (attempted_by_user_id, attempted_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE piggies ENABLE ROW LEVEL SECURITY;
ALTER TABLE piggy_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_claim_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "user_profiles_select_own" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- piggies
CREATE POLICY "piggies_select_own" ON piggies
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "piggies_insert_own" ON piggies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "piggies_update_own" ON piggies
  FOR UPDATE USING (auth.uid() = user_id);

-- piggy_balances: owner read-only, write via service_role only
CREATE POLICY "piggy_balances_select_own" ON piggy_balances
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM piggies WHERE id = piggy_id)
  );

-- gifts: sender hoặc piggy owner xem được
CREATE POLICY "gifts_select_sender_or_owner" ON gifts
  FOR SELECT USING (
    auth.uid() = from_user_id
    OR auth.uid() = (SELECT user_id FROM piggies WHERE id = to_piggy_id)
  );
-- authenticated user tạo gift
CREATE POLICY "gifts_insert_authenticated" ON gifts
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id
    AND status = 'pending'
    AND expires_at > now()
    AND amount > 0
  );

-- transactions: owner read-only, write via service_role only
CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- price_cache: authenticated read (public price data)
CREATE POLICY "price_cache_select_authenticated" ON price_cache
  FOR SELECT USING (auth.role() = 'authenticated');

-- gift_claim_audit: no client access (service_role only)

-- ─── Triggers ────────────────────────────────────────────────────────────────

-- Auto-create piggy_balances khi piggy được tạo
CREATE OR REPLACE FUNCTION create_piggy_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO piggy_balances (piggy_id, gold_amount)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_piggy_created
  AFTER INSERT ON piggies
  FOR EACH ROW EXECUTE FUNCTION create_piggy_balance();

-- Auto-create user_profiles khi user đăng ký
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Cron Jobs ───────────────────────────────────────────────────────────────

-- Expire pending gifts mỗi giờ (pg_cron)
SELECT cron.schedule(
  'expire-pending-gifts',
  '0 * * * *',
  $$
    UPDATE gifts
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < now();
  $$
);
