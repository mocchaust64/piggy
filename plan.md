PRODUCT & TECHNICAL SPECIFICATION — "GOLD PIGGY BANK" (Vàng Heo Đất)
For Claude AI / Cursor to build the full codebase
Version: Senior Tech Lead v3.2
Date: 2026-04-10

---

## 1. Product Vision

**Vision:** Build "Gold Piggy Bank" (Vàng Heo Đất) — a mobile app that helps Vietnamese families accumulate tokenized gold (GOLD) easily, safely, and in a culturally meaningful way, focused on children's savings and cultural gifting.

**Mission:** Use Oro's GRAIL API to bring tokenized gold into real-world use cases: piggy banks for children + East Asian cultural gifts (Tết, birthdays, weddings, first birthdays…).

**Long-term roadmap:**
- Phase 1 (2026): MVP iOS + Android → Apply for GRAIL Grant → Acquire initial users through viral gifting
- Phase 2 (2026–2027): Auto top-up, family tools, staking (if Oro supports)
- Phase 3 (2027+): Financial education, white-label, regional expansion

**Core values:**
- 100% compliant with Oro GRAIL Grant requirements
- Custodial-first (no wallet or private key knowledge required from users)
- Strong cultural relevance (East Asian gift templates)
- Ultra-simple UX for non-crypto users (parents aged 30–45)
- Vietnamese legal compliance (no fiat on-ramp via VN banks, Momo, ZaloPay…)

---

## 2. User Personas

- **Parents (Primary User)** — aged 30–45, want their children to accumulate long-term assets in gold
- **Grandparents / relatives** — send Tết, wedding, birthday, first-birthday gifts
- **Children / teenagers** — view their piggy bank and learn savings habits through fun animations
- **Multi-child families** — manage multiple piggy banks simultaneously

---

## 3. Feature Roadmap

### MVP (4 weeks — for GRAIL Grant application)
- Apple Sign In + Email/OTP authentication
- Create a Piggy Bank for a child (name, cute avatar, savings goal)
- Buy GOLD with USDC via GRAIL API only (custodial mode)
- Gift GOLD via Deep Link / QR Code / Share (Tết, Birthday, Wedding, First Birthday templates)
- Piggy bank animation + confetti on gift receipt (realtime)
- View piggy balance + mini GOLD price chart
- Basic transaction history

### Phase 2 (post-grant)
- Full Android support
- Zalo Share + optimized deep links
- Recurring auto top-up via GRAIL
- Push notifications + price alerts
- Family dashboard (manage multiple piggies)
- GOLD staking (if Oro GRAIL supports yield)

### Phase 3
- Financial education for children
- Referral & viral gifting campaigns
- Admin dashboard

> ⚠️ **No fiat on-ramps** (VN banks, Momo, ZaloPay…) in any phase. All GOLD purchases only via USDC + GRAIL API.

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81.5 / Expo SDK 54 (EAS Build) — iOS first |
| Routing | Expo Router v6 (file-based) |
| UI | NativeWind v4 + Tailwind CSS v3 + Reanimated 4 + Lottie |
| State | Zustand v5 + TanStack Query v5 |
| i18n | i18next + react-i18next + expo-localization |
| Auth | Supabase Auth (Apple Sign In + Email/OTP) |
| Database | Supabase (PostgreSQL + Edge Functions + Storage) |
| Blockchain | Oro GRAIL REST API (custodial mode — mandatory) |
| Notifications | Expo Notifications (APNs + FCM) |
| Analytics | PostHog + Sentry |
| Testing | Jest + @testing-library/react-native + Maestro (E2E) |

---

## 5. Internationalization (i18n)

The app ships with two languages. Default locale follows the device language, falls back to Vietnamese.

| Context | Language |
|---------|---------|
| Code (variables, functions, comments) | English |
| UI strings — `src/i18n/locales/en.ts` | English |
| UI strings — `src/i18n/locales/vi.ts` | Vietnamese |
| Docs (plan.md, ADR.md, CLAUDE.md) | English |

Usage in components:
```typescript
const { t } = useTranslation()
// t('piggy.balance') → 'Gold Balance' (EN) / 'Số dư vàng' (VI)
```

---

## 6. Security Architecture

### GRAIL API Key — Server-side only

```
Mobile App  →  Supabase Edge Function  →  GRAIL API (Oro)
                  (GRAIL_API_KEY here)
```

**The GRAIL API key must NEVER appear in the React Native app bundle.**

```typescript
// ✅ Correct — mobile app only calls Edge Function
const { data } = await supabase.functions.invoke('buy-gold', {
  body: { piggyId, amountUSDC },
})

// ❌ Wrong — direct call from mobile, key is exposed
fetch('https://api.oro.io/grail/buy', {
  headers: { 'Authorization': `Bearer ${GRAIL_API_KEY}` },
})
```

All GRAIL calls live in `/supabase/functions/`. `src/services/grailService.ts` is a thin `invoke()` wrapper only.

### Custodial Mode Only
- Never store private keys or seed phrases
- Never call Solana RPC directly
- Never integrate user wallets (Phantom, etc.)

### RLS — Default Deny

Every table must have RLS enabled. Policy model:

| Table | Client SELECT | Client INSERT | Client UPDATE | service_role write only |
|-------|--------------|--------------|--------------|------------------------|
| user_profiles | owner | owner | owner | — |
| piggies | owner | owner | owner | — |
| piggy_balances | piggy owner | ❌ | ❌ | ✅ |
| gifts | sender / piggy owner | auth users | ❌ | ✅ |
| transactions | owner | ❌ | ❌ | ✅ |
| gift_claim_audit | ❌ | ❌ | ❌ | ✅ |

`piggy_balances` and `transactions` are written only by Edge Functions via the `service_role` key.

---

## 7. Database Schema

```sql
-- User profiles (Supabase auth.users does not store app-specific data)
user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  display_name text,
  grail_user_id text,               -- GRAIL custodial user reference
  grail_deposit_address text,       -- USDC deposit address from GRAIL
  grail_usdc_balance numeric DEFAULT 0,  -- cached, synced on app open
  notification_token text,
  notification_preferences jsonb DEFAULT '{"gifts": true, "priceAlerts": false}',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- Children's piggy banks
piggies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  child_name text NOT NULL,
  avatar_url text,
  target_amount numeric CHECK (target_amount > 0),
  target_description text,
  deleted_at timestamptz,           -- soft delete only
  last_synced_at timestamptz,       -- last sync with GRAIL
  created_at timestamptz DEFAULT now()
)

-- Gold balance per piggy
piggy_balances (
  piggy_id uuid REFERENCES piggies PRIMARY KEY,
  gold_amount numeric DEFAULT 0 CHECK (gold_amount >= 0),
  grail_wallet_id text,             -- GRAIL sub-wallet ID (if Oro supports)
  last_updated timestamptz DEFAULT now()
)

-- Gold gifts
gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users NOT NULL,
  to_piggy_id uuid REFERENCES piggies NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  message text,
  template_type text CHECK (template_type IN ('tet', 'sinhnhat', 'cuoihoi', 'thoinhoi')),
  claim_code text UNIQUE NOT NULL,  -- format: 'heo-[nanoid(10)]'
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'transfer_in_progress', 'claimed', 'failed', 'expired', 'cancelled_by_sender')),
  recipient_user_id uuid REFERENCES auth.users,
  grail_tx_reference text,
  claim_attempts integer DEFAULT 0,
  expires_at timestamptz NOT NULL,  -- 30 days from creation
  claimed_at timestamptz,
  cancelled_at timestamptz,
  sender_notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- Transaction audit trail
transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  piggy_id uuid REFERENCES piggies,
  type text NOT NULL CHECK (type IN ('buy_gold', 'gift_sent', 'gift_received')),
  amount numeric NOT NULL CHECK (amount > 0),   -- gold in grams
  usdc_amount numeric,                           -- USDC spent
  gold_price_at_time numeric,                    -- USD/gram at time of tx
  fee_amount numeric DEFAULT 0,
  grail_tx_reference text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message text,
  metadata jsonb,                                -- raw GRAIL response
  created_at timestamptz DEFAULT now()
)

-- Gift claim audit log (security + compliance)
gift_claim_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id uuid REFERENCES gifts,
  attempted_by_user_id uuid REFERENCES auth.users,
  result text CHECK (result IN ('success', 'already_claimed', 'expired', 'invalid_code', 'in_progress', 'rate_limited')),
  attempted_at timestamptz DEFAULT now()
)

-- Gold price cache (10-minute TTL, managed by Edge Function)
price_cache (
  id text PRIMARY KEY,              -- 'gold_price_current' | 'gold_price_7d' | 'gold_price_30d'
  data jsonb NOT NULL,
  cached_at timestamptz DEFAULT now()
)
```

### Required indexes

```sql
CREATE INDEX idx_piggies_user_id ON piggies (user_id);
CREATE INDEX idx_piggies_active ON piggies (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_gifts_claim_code ON gifts (claim_code);
CREATE INDEX idx_gifts_from_user_id ON gifts (from_user_id);
CREATE INDEX idx_gifts_to_piggy_id ON gifts (to_piggy_id);
CREATE INDEX idx_gifts_pending ON gifts (expires_at) WHERE status = 'pending';
CREATE INDEX idx_transactions_user_id ON transactions (user_id);
CREATE INDEX idx_transactions_piggy_id ON transactions (piggy_id);
CREATE INDEX idx_transactions_grail_ref ON transactions (grail_tx_reference);
CREATE INDEX idx_gift_claim_audit_rate_limit ON gift_claim_audit (attempted_by_user_id, attempted_at DESC);
```

---

## 8. GRAIL API Integration Strategy

### Architecture

The mobile app **never** calls GRAIL directly. All GRAIL calls live in Supabase Edge Functions:

```
/supabase/functions/
  buy-gold/index.ts         — Buy GOLD with USDC
  claim-gift/index.ts       — Claim a gift (atomic state transition)
  transfer-gold/index.ts    — Transfer GOLD between piggies
  get-balance/index.ts      — Fetch balance from GRAIL
  get-gold-price/index.ts   — Fetch price + history (cached 10 min)
```

### Client wrapper (`src/services/grailService.ts`)

```typescript
// Thin invoke wrapper only — no GRAIL_API_KEY here
export async function buyGold(piggyId: string, amountUSDC: number) {
  const { data, error } = await supabase.functions.invoke('buy-gold', {
    body: { piggyId, amountUSDC },
  })
  if (error) throw new Error('Unable to buy gold, please try again')
  return data
}
```

### Edge Functions to implement
- `buyGoldWithUSDC(piggyId, amountUSDC)` — buy GOLD, log to transactions
- `transferGold(fromPiggyId, toPiggyId, amount, message?)` — gift transfer
- `getGoldBalance(piggyId)` — fetch balance from GRAIL custodial wallet
- `getCurrentGoldPrice()` — current GOLD price
- `getGoldPriceHistory(period)` — price history for mini chart (cached 10 min)
- `getUSDCBalance(userId)` — user's USDC balance
- `getDepositAddress(userId)` — USDC deposit address

Every GRAIL call: max 3 retries (exponential backoff), log `grail_tx_reference` to transactions.

### Price feed & mini chart

Edge Function `get-gold-price` caches results for 10 minutes in the `price_cache` table.
TanStack Query `staleTime: 10 * 60 * 1000` for price queries. No continuous polling.

### USDC wallet management

USDC is managed via GRAIL's custodial system. Full flow:

1. User buys USDC on an exchange (Binance, Bybit, Remitano…)
2. User transfers USDC to their GRAIL custodial account (via deposit address from GRAIL API)
3. App displays the USDC balance in the GRAIL account
4. User buys GOLD with USDC in the app

**Required onboarding tutorial** (3–4 screens) for non-crypto users:
- Screen 1: "Gold Piggy Bank uses USDC — a stable digital currency"
- Screen 2: "Step 1: Buy USDC on Binance/Bybit (link to guide)"
- Screen 3: "Step 2: Deposit USDC into your in-app wallet"
- Screen 4: "Step 3: Buy GOLD for your child's piggy bank"

**"My Wallet" screen** must show: USDC balance + deposit address + deposit history.

> **Current MVP wallet strategy:** 1 GRAIL custodial account per parent. Each piggy's balance is tracked in `piggy_balances.gold_amount` (DB). GRAIL sees only the parent's total balance.
>
> **If Oro confirms sub-account support:** migrate to a `grail_wallet_id` per piggy — the schema already has this field, just needs to be populated. No UI or business logic changes required.
>
> ⏳ **Awaiting confirmation from Oro team** on: sub-accounts, deposit address endpoint, buy/transfer/balance/price history endpoints.

---

## 9. Gift Claim State Machine

```
pending
  └─→ transfer_in_progress   ← atomic DB lock, prevents double-claim
        ├─→ claimed ✓         ← GRAIL transfer succeeded + balance updated
        └─→ failed            ← GRAIL transfer failed (retryable)
  └─→ expired                 ← pg_cron runs hourly
  └─→ cancelled_by_sender
```

**Critical:** The `pending → transfer_in_progress` transition must be atomic:
```sql
UPDATE gifts
SET status = 'transfer_in_progress'
WHERE id = $1 AND status = 'pending' AND expires_at > now()
RETURNING *
-- 0 rows returned = already claimed or expired
```

---

## 10. User Flows (MVP)

### Flow 1 — Create Piggy Bank
Onboarding → Apple Sign In or Email → Create `user_profiles` record → "Create Piggy Bank" → Enter child info (name, avatar, goal) → GRAIL creates custodial wallet → (Optional) Deposit USDC → Buy GOLD via GRAIL

### Flow 2 — Gift Gold
Open piggy → "Send a gift" → Choose template + GOLD amount + message → Create gift record (`status: pending`, `expires_at: now() + 30 days`) → Generate `claim_code` with `nanoid(10)` → Create deep link + QR code → Share via Zalo / messaging apps

### Flow 3 — Claim Gift
Recipient opens deep link `heodat://gift/[claim_code]` → If app not installed: redirect to App Store, preserve code in URL params → Sign in → Atomic claim (Edge Function) → Confetti animation + realtime balance update

---

## 11. Deep Link Specification

**URI scheme:** `heodat://gift/[claim_code]`

**Universal links:** `https://heodat.app/gift/[claim_code]`
- Must host `/.well-known/apple-app-site-association` at `heodat.app`
- Android App Links: `/.well-known/assetlinks.json`

**Web fallback:** If app is not installed → simple web page showing gift info + "Download app to claim" button → redirect to App Store/Play Store with `claim_code` in URL params for auto-claim after install.

`app.config.ts`:
```typescript
scheme: 'heodat',
intentFilters: [{ action: 'VIEW', data: [{ scheme: 'heodat' }] }]
```

---

## 12. Environment Configuration

```
# Mobile app — EXPO_PUBLIC_ prefix = safe in bundle
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POSTHOG_KEY=

# Edge Functions only — never use EXPO_PUBLIC_
GRAIL_API_KEY=
GRAIL_BASE_URL=https://api.oro.io/grail
SUPABASE_SERVICE_ROLE_KEY=
SENTRY_DSN=
```

`eas.json` profiles: `development` (Expo Go), `preview` (TestFlight internal), `production` (App Store).

---

## 13. Folder Structure

```
/app                        ← Expo Router routes
  (auth)/
    login.tsx
    signup.tsx
  (tabs)/
    index.tsx               ← Home / piggy list
    transactions.tsx
    profile.tsx
  piggy/
    [id].tsx                ← Piggy detail
    create.tsx
  gift/
    [code].tsx              ← Claim gift screen
    create.tsx
/src
  /i18n
    index.ts                ← i18n initializer (import in _layout.tsx)
    /locales
      en.ts                 ← English strings (type source of truth)
      vi.ts                 ← Vietnamese strings
  /components               ← Shared UI (atomic design)
    /ui/                    ← Button, Input, Card, Skeleton...
    /gift/                  ← GiftTemplateCard, GiftAnimation
    /piggy/                 ← PiggyCard, PiggyAnimation (Lottie)
  /features
    /piggy/
    /gift/
    /auth/
  /hooks                    ← Custom React hooks (use[Name].ts)
  /services                 ← invoke() wrappers — no direct GRAIL calls
    grailService.ts
    notificationService.ts
  /lib
    supabaseClient.ts
    analytics.ts
  /types
    database.ts             ← Run: supabase gen types typescript --local
    index.ts
  /constants
    giftTemplates.ts        ← Template config (strings via i18n keys)
    colors.ts
/supabase
  /functions                ← Deno Edge Functions — GRAIL key lives here
    /buy-gold/
    /claim-gift/
    /transfer-gold/
    /get-balance/
    /get-gold-price/
    /send-notification/
  /migrations               ← YYYYMMDDHHMMSS_description.sql
/assets
  /lottie
  /images
```

---

## 14. Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Jest + @testing-library/react-native | Components, hooks, utils |
| Integration | Jest + Supabase local | Edge Functions with real DB |
| E2E | Maestro | Gift claim flow, buy gold flow |
| GRAIL mock | MSW (Mock Service Worker) | Dev/test before API key is available |

**Critical test cases:**
- Gift cannot be claimed twice simultaneously (race condition)
- Expired gift cannot be claimed
- GRAIL API timeout → retry logic works correctly
- RLS: user A cannot read user B's piggies

---

## 15. Code Standards

- TypeScript strict mode (`"strict": true`)
- ESLint + Prettier + Husky pre-commit
- NativeWind `className` — never `StyleSheet.create()`
- All UI strings via `useTranslation()` — never hardcoded
- No `any` type
- Custom hooks for all data fetching (TanStack Query)
- Clear comments at every GRAIL integration point

---

## 16. Cron Jobs

Supabase does not have built-in cron for Edge Functions. Use **`pg_cron`** (supported by Supabase):

```sql
-- Expire pending gifts every hour
SELECT cron.schedule(
  'expire-pending-gifts',
  '0 * * * *',
  $$
    UPDATE gifts
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < now();
  $$
);
```

Enable via Supabase Dashboard → Database → Extensions → `pg_cron`.

---

## 17. Database Migration Strategy

All schema changes must go through migration files — never edit production directly:

```
supabase/migrations/
  20260410033855_initial_schema.sql   ← full schema + RLS + indexes + triggers + cron
  20260410XXXXXX_[description].sql
  ...
```

After every schema change:
```bash
supabase gen types typescript --local > src/types/database.ts
```

---

## 18. Security & Compliance

- Never store private keys or seed phrases
- 100% custodial mode
- Supabase RLS on all tables + audit logging (`gift_claim_audit`)
- Rate limiting for gift claim: max 10 attempts/hour per user (tracked via `gift_claim_audit`)
- `claim_code` format: `heo-[nanoid(10)]` (e.g. `heo-a3f9k2m7p1`), expires after 30 days
- Every GRAIL transaction logged with `grail_tx_reference`
- `SUPABASE_SERVICE_ROLE_KEY` only in Edge Functions, never in the mobile app

---

## 19. Analytics Events (PostHog)

Defined upfront to measure KPIs for the GRAIL Grant. Implemented in `src/lib/analytics.ts`:

| Event | When | Properties |
|-------|------|-----------|
| `piggy_created` | Piggy bank created | `has_target` |
| `gold_purchased` | GOLD bought successfully | `usdc_amount`, `gold_grams`, `piggy_id` |
| `gift_created` | Gift created | `template_type`, `gold_amount` |
| `gift_shared` | Share button tapped | `share_method` (zalo/copy/qr) |
| `gift_claimed` | Gift claimed successfully | `template_type`, `gold_amount`, `time_to_claim_hours` |
| `gift_claim_failed` | Claim failed | `reason` (expired/already_claimed/error) |
| `onboarding_completed` | Onboarding finished | `auth_method` (apple/email) |
| `usdc_deposit_viewed` | USDC deposit screen opened | — |
| `gift_template_selected` | Template selected | `template` |

---

## 20. Auth Roadmap

**MVP (iOS):** Apple Sign In + Email/OTP — sufficient for TestFlight and App Store.

**Phase 2 (Android):** Add:
- Google Sign In (improves Android conversion)
- Zalo OAuth (high importance for Vietnamese market — Supabase supports custom OAuth providers)

---

## 21. Deployment

- **Development:** Expo Go + Supabase local (`supabase start`)
- **Testing:** EAS Build + TestFlight (iOS) / Internal track (Android)
- **Production:** EAS Build → App Store + Play Store
