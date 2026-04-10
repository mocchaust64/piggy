# Gold Piggy Bank — Claude Instructions

## About

React Native + Expo app for Vietnamese families to save tokenized gold (GOLD) for their children. Integrates Oro GRAIL API (custodial). Backend: Supabase.

**App name:** "Vàng Heo Đất" (Vietnamese) / "Gold Piggy Bank" (English)
**Target users:** Vietnamese parents aged 30–45

---

## 🔴 CRITICAL RULES — Never violate

### 1. GRAIL API key must stay server-side

The GRAIL API key **must never** appear in the React Native / Expo app bundle.

```typescript
// ✅ Correct — mobile app only calls Edge Function
const { data, error } = await supabase.functions.invoke('buy-gold', {
  body: { piggyId, amountUSDC },
})

// ❌ Wrong — direct call from mobile, key is exposed
fetch('https://api.oro.io/grail/...', {
  headers: { 'Authorization': `Bearer ${GRAIL_API_KEY}` }, // never do this
})
```

All GRAIL calls live in `/supabase/functions/`. `src/services/grailService.ts` is a thin `invoke()` wrapper only.

### 2. Custodial mode only

- Never store private keys or seed phrases
- Never call Solana RPC directly
- Never integrate user wallets (Phantom, Solflare, etc.)
- Use GRAIL custodial endpoints only

### 3. RLS must be enabled on every table

Every new table must have:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
-- Plus at least one policy
```

`piggy_balances` and `transactions` are **write-only by Edge Functions** (service_role). Never grant write access to clients.

### 4. No fiat on-ramps

Never integrate:
- Vietnamese banks
- Momo / ZaloPay / VNPay
- Any payment gateway

Only USDC + GRAIL API.

### 5. Every GRAIL transaction must be logged

After every successful GRAIL call, insert into `transactions`:
```typescript
await adminClient.from('transactions').insert({
  user_id,
  piggy_id,
  type: 'buy_gold' | 'gift_sent' | 'gift_received',
  amount,
  usdc_amount,
  grail_tx_reference: grailResponse.transactionId,
  gold_price_at_time: currentPrice,
  status: 'completed',
})
```

### 6. All UI strings go through i18n

Never hardcode display text. Always use `useTranslation()`:
```typescript
const { t } = useTranslation()
// <Text>{t('piggy.balance')}</Text>
```

Add every new string to both `src/i18n/locales/en.ts` and `src/i18n/locales/vi.ts`.

---

## Language Policy

| Context | Language |
|---------|---------|
| Code (variables, functions, comments) | English |
| UI strings (via i18n) | English (`en.ts`) + Vietnamese (`vi.ts`) |
| Skill files (`.claude/commands/`) | English |
| Git commit messages | English |
| plan.md, ADR.md, CLAUDE.md | English |

Default locale follows device language, falls back to Vietnamese.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81.5 / Expo SDK 54 |
| Routing | Expo Router v6 (file-based) |
| UI | NativeWind v4 + Tailwind CSS v3 |
| Animation | Reanimated 4 + Lottie |
| State | Zustand v5 + TanStack Query v5 |
| i18n | i18next + react-i18next + expo-localization |
| Auth | Supabase Auth (Apple Sign In + Email/OTP) |
| Database | Supabase (PostgreSQL + Edge Functions) |
| Blockchain | Oro GRAIL REST API (custodial) |
| Notifications | Expo Notifications |
| Analytics | PostHog + Sentry |

---

## Folder Structure

```
/app                          ← Expo Router routes
  (auth)/login.tsx
  (auth)/signup.tsx
  (tabs)/index.tsx
  (tabs)/transactions.tsx
  (tabs)/profile.tsx
  piggy/[id].tsx
  piggy/create.tsx
  gift/[code].tsx
  gift/create.tsx
/src
  /i18n
    index.ts                  ← i18n initializer (import before rendering)
    /locales
      en.ts                   ← English strings (source of truth for types)
      vi.ts                   ← Vietnamese strings
  /components                 ← Shared UI (atomic design)
    /ui/                      ← Button, Input, Card, Skeleton...
    /gift/                    ← GiftTemplateCard, GiftAnimation
    /piggy/                   ← PiggyCard, PiggyAnimation
  /features
    /piggy/
    /gift/
    /auth/
  /hooks                      ← Custom React hooks (use[Name].ts)
  /services                   ← Supabase invoke wrappers (no direct GRAIL calls)
    grailService.ts
    notificationService.ts
  /lib
    supabaseClient.ts
    analytics.ts
  /types
    database.ts               ← Run: supabase gen types typescript --local
    index.ts
  /constants
    giftTemplates.ts          ← Template config (strings via i18n keys)
    colors.ts
/supabase
  /functions                  ← Deno Edge Functions — GRAIL key lives here
    /buy-gold/
    /claim-gift/
    /transfer-gold/
    /get-balance/
    /send-notification/
  /migrations                 ← YYYYMMDDHHMMSS_description.sql
/assets
  /lottie
  /images
```

---

## Database Schema (summary)

Tables: `user_profiles`, `piggies`, `piggy_balances`, `gifts`, `transactions`, `gift_claim_audit`, `price_cache`

Full schema with RLS policies and indexes is in `supabase/migrations/20260410033855_initial_schema.sql`.

RLS model:

| Table | Client read | Client write | service_role |
|-------|------------|-------------|-------------|
| user_profiles | owner | owner | bypass |
| piggies | owner | owner | bypass |
| piggy_balances | piggy owner | ❌ | ✅ only |
| gifts | sender / piggy owner | INSERT only | bypass |
| transactions | owner | ❌ | ✅ only |
| gift_claim_audit | ❌ | ❌ | ✅ only |

---

## Environment Variables

```
# Mobile app — EXPO_PUBLIC_ prefix = safe in bundle
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POSTHOG_KEY=

# Edge Functions only — never use EXPO_PUBLIC_ prefix
GRAIL_API_KEY=
GRAIL_BASE_URL=https://api.oro.io/grail
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Coding Standards

- TypeScript strict mode (`"strict": true`)
- ESLint + Prettier (see `.prettierrc`)
- NativeWind `className` — never `StyleSheet.create()`
- No `any` type
- Custom hooks for all data fetching (TanStack Query)
- All UI strings via `useTranslation()` — never hardcoded

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Screen component | PascalCase | `PiggyDetailScreen` |
| Hook | `use` + PascalCase | `usePiggyBalance` |
| Service function | camelCase | `buyGold`, `claimGift` |
| Edge Function | kebab-case | `buy-gold`, `claim-gift` |
| Migration file | `YYYYMMDDHHMMSS_snake_case` | `20260410000001_initial_schema` |
| Zustand store | camelCase + `Store` | `usePiggyStore` |
| i18n key | `section.camelCase` | `piggy.balance`, `gift.claimButton` |

---

## How to Work Effectively

1. **Read before editing** — never suggest changes to code you haven't read
2. **Check `src/types/database.ts` first** — use correct types, never guess field names
3. **Use skills** — check `.claude/commands/` before scaffolding manually
4. **No unrequested features** — don't refactor, clean up, or add improvements beyond what's asked
5. **Check ADR.md** — don't propose changes to already-decided architecture

### When to use which skill

| Situation | Skill |
|-----------|-------|
| New screen needed | `/new-screen` |
| New GRAIL integration | `/grail-endpoint` + `/audit-grail-call` |
| Schema change | `/supabase-migration` |
| New gift occasion | `/gift-template` |
| New Edge Function | `/edge-function` |
| RLS error | `/fix-rls` |
| Reviewing GRAIL code | `/audit-grail-call` |

### Key files to read before working on any feature

| File | Purpose |
|------|---------|
| `src/types/database.ts` | TypeScript types for all Supabase tables |
| `src/i18n/locales/en.ts` | All UI strings (source of truth for type shape) |
| `DOCS/GRAIL_API_SPEC.md` | Local reference for GRAIL API endpoints |
| `src/constants/giftTemplates.ts` | Gift template config |
| `src/lib/supabaseClient.ts` | Shared Supabase client |
| `ADR.md` | Architecture decisions with reasoning |

---

## Gift Claim State Machine

```
pending
  └─→ transfer_in_progress   ← atomic UPDATE lock
        ├─→ claimed ✓
        └─→ failed
  └─→ expired                ← pg_cron runs hourly
  └─→ cancelled_by_sender
```

The `pending → transfer_in_progress` transition **must be atomic**:
```sql
UPDATE gifts SET status = 'transfer_in_progress'
WHERE id = $1 AND status = 'pending' AND expires_at > now()
RETURNING *
-- 0 rows returned = already claimed or expired
```

---

## Available Skills

| Command | Use when |
|---------|---------|
| `/grail-ref` | Reference GRAIL documentation and rules |
| `/new-screen` | Adding a new Expo Router screen |
| `/grail-endpoint` | Adding a new GRAIL API integration |
| `/supabase-migration` | Changing the database schema |
| `/gift-template` | Adding a new cultural gift template |
| `/edge-function` | Adding a non-GRAIL Edge Function |
| `/fix-rls` | Debugging or writing RLS policies |
| `/audit-grail-call` | Reviewing GRAIL integration for security |
