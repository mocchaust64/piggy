# Plan: Parent Gold Wallet + Piggy Allocation

**Status:** Proposed  
**Date:** 2026-04-13  
**ADR reference:** ADR-011 (MVP dùng 1 GRAIL account per parent + virtual balances per piggy)

---

## Problem Statement

Hiện tại flow "Buy Gold" được thiết kế gắn trực tiếp với từng piggy — user phải chọn piggy trước rồi mới mua. Điều này tạo ra UX không tự nhiên và không phản ánh đúng thực tế GRAIL (1 custodial account per parent).

Flow đúng theo cả UX lẫn architecture:

1. Parent mua vàng vào **ví tổng** của mình
2. Parent chủ động **phân bổ** vàng từ ví tổng vào từng heo

---

## Architecture Decision

Đây là **extension của ADR-011**, không phải thay đổi. ADR-011 đã chốt: GRAIL chỉ thấy 1 account per parent. Ta chỉ thêm lớp "parent wallet" ở DB level để phản ánh đúng thực tế đó.

**Data model:**

```
GRAIL custodial account (1 per parent)
    └── user_profiles.gold_balance   ← tổng vàng parent đang giữ (chưa phân bổ)
    └── piggy_balances.gold_amount   ← vàng đã phân bổ cho heo cụ thể
```

**Invariant (bất biến):**

```
user.gold_balance + SUM(piggy_balances.gold_amount WHERE piggy.user_id = user.id)
= GRAIL total gold balance của parent
```

Invariant này được đảm bảo bởi Postgres transaction trong Edge Functions — không bao giờ update một bên mà không update bên kia.

---

## Scope

### In scope

- Thêm `gold_balance` vào `user_profiles`
- Sửa Edge Function `buy-gold`: mua vàng vào ví parent, không gắn piggy
- Tạo Edge Function `allocate-gold`: chuyển từ ví parent → piggy (atomic)
- Cập nhật transaction types: thêm `allocate_to_piggy`
- Wallet screen: hiển thị USDC + vàng tổng, nút mua vàng
- Piggy detail: đổi "Buy Gold" → "Add Gold" (allocate từ ví)
- Home screen: hiển thị gold balance của parent trong wallet summary

### Out of scope

- GRAIL sub-accounts (đợi Oro confirm — migration path đã có trong ADR-011)
- Transfer vàng giữa hai piggies (Phase 2)
- Withdraw vàng về GRAIL (Phase 2)

---

## Database Migration

**File:** `supabase/migrations/20260413000001_parent_gold_wallet.sql`

### Changes

```sql
-- 1. Thêm gold_balance vào user_profiles
ALTER TABLE user_profiles
  ADD COLUMN gold_balance numeric DEFAULT 0 NOT NULL CHECK (gold_balance >= 0);

-- 2. Thêm 'allocate_to_piggy' vào transaction types
ALTER TABLE transactions
  DROP CONSTRAINT transactions_type_check;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('buy_gold', 'gift_sent', 'gift_received', 'allocate_to_piggy'));

-- 3. Postgres function: atomic allocate gold from parent → piggy
--    Dùng trong Edge Function allocate-gold để đảm bảo invariant.
CREATE OR REPLACE FUNCTION allocate_gold_to_piggy(
  p_user_id    uuid,
  p_piggy_id   uuid,
  p_amount     numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Kiểm tra parent balance đủ (lock row để tránh race condition)
  PERFORM 1
    FROM user_profiles
    WHERE id = p_user_id
      AND gold_balance >= p_amount
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_GOLD_BALANCE';
  END IF;

  -- Atomic debit parent + credit piggy
  UPDATE user_profiles
    SET gold_balance = gold_balance - p_amount
    WHERE id = p_user_id;

  UPDATE piggy_balances
    SET gold_amount = gold_amount + p_amount,
        last_updated = now()
    WHERE piggy_id = p_piggy_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PIGGY_BALANCE_NOT_FOUND';
  END IF;
END;
$$;
```

### RLS Update

```sql
-- user_profiles: thêm quyền đọc gold_balance (owner only, đã có policy)
-- Không cần thêm policy mới — policy hiện tại "user_profiles_select_own" đã cover
-- gold_balance KHÔNG bao giờ được client UPDATE trực tiếp (chỉ service_role qua Edge Function)
```

---

## Edge Functions

### 1. Sửa `buy-gold` (breaking change)

**Trước:** `{ piggyId, goldAmountGrams, maxUsdcAmount }` → credit thẳng vào piggy  
**Sau:** `{ goldAmountGrams, maxUsdcAmount }` → credit vào `user_profiles.gold_balance`

```
POST /functions/v1/buy-gold
Body: { goldAmountGrams: number, maxUsdcAmount: number }
      ^^ bỏ piggyId ^^

Flow:
1. Authenticate JWT → userId
2. Check GRAIL USDC balance (slippage guard)
3. Estimate price
4. Insert pending transaction (type: 'buy_gold', piggy_id: null)
5. Call GRAIL purchase
6. UPDATE user_profiles SET gold_balance = gold_balance + goldAmountGrams
7. Mark transaction completed
```

### 2. Tạo `allocate-gold` (mới)

```
POST /functions/v1/allocate-gold
Body: { piggyId: string, goldAmountGrams: number }

Flow:
1. Authenticate JWT → userId
2. Verify piggy ownership
3. Validate goldAmountGrams > 0
4. Call DB function allocate_gold_to_piggy(userId, piggyId, amount)
   — atomic: debit parent, credit piggy trong 1 transaction
   — nếu balance không đủ → RAISE EXCEPTION → trả về lỗi rõ ràng
5. Insert transaction record (type: 'allocate_to_piggy', piggy_id: piggyId)
6. Return success
```

**Không cần GRAIL call** — đây là internal DB operation, GRAIL balance không thay đổi.

---

## Mobile App Changes

### Screens

```
app/
  (tabs)/
    index.tsx          ← thêm wallet summary (gold_balance + USDC)
  wallet.tsx           ← màn hình mới: Ví của tôi
  piggy/
    [id].tsx           ← đổi "Buy Gold" → "Add Gold from Wallet"
```

### Components

```
src/components/
  wallet/
    WalletSummaryCard.tsx    ← card hiển thị USDC + gold balance (dùng ở home)
    BuyGoldSheet.tsx         ← move từ piggy/ sang đây (không còn piggyId)
  piggy/
    AllocateGoldSheet.tsx    ← mới: chuyển từ ví vào heo này
```

### Hooks

```
src/hooks/
  useBuyGold.ts        ← sửa: bỏ piggyId, invalidate userProfile thay vì piggy
  useAllocateGold.ts   ← mới: mutation gọi allocate-gold Edge Function
  useWalletBalance.ts  ← mới: query gold_balance + usdc_balance từ user_profiles
```

### Services

```typescript
// grailService.ts — thêm:
export async function buyGold(goldAmountGrams: number, maxUsdcAmount: number): Promise<BuyGoldData>
// bỏ tham số piggyId

export async function allocateGold(
  piggyId: string,
  goldAmountGrams: number,
): Promise<AllocateGoldData>
// không gọi GRAIL, chỉ invoke Edge Function
```

### i18n

Thêm vào `en.ts` và `vi.ts`:

```
wallet.goldBalance        — "Gold Balance" / "Số dư vàng"
wallet.allocateGold       — "Add to Piggy" / "Thêm vào heo"
wallet.availableGold      — "Available gold" / "Vàng chưa phân bổ"
allocateGold.title        — "Add Gold to Piggy" / "Thêm vàng vào heo đất"
allocateGold.subtitle     — "From your wallet" / "Từ ví của bạn"
allocateGold.available    — "Available: {{amount}}g" / "Có sẵn: {{amount}}g"
allocateGold.errorInsufficient — ...
```

---

## UX Flow (sau khi xong)

```
Home Screen
└── Wallet Summary Card
    ├── USDC: 50.00
    ├── Gold: 0.52g (chưa phân bổ)
    └── [Mua Vàng] → BuyGoldSheet (không cần chọn piggy)

Wallet Screen (app/wallet.tsx)
├── USDC Balance + [Nạp USDC]
├── Gold Balance (chưa phân bổ)
├── [Mua Vàng]
└── Danh sách phân bổ gần đây

Piggy Detail Screen
├── Số dư: 0.1g (đã phân bổ vào heo này)
├── [Thêm vàng] → AllocateGoldSheet
│   ├── "Ví của bạn: 0.42g"
│   ├── Input: bao nhiêu gram
│   └── [Xác nhận]
└── [Tặng quà]
```

---

## Implementation Order

1. **Migration** — `20260413000001_parent_gold_wallet.sql`
   - Thêm `gold_balance`, sửa constraint, tạo `allocate_gold_to_piggy()`

2. **Edge Function: sửa `buy-gold`**
   - Bỏ `piggyId`, credit vào `user_profiles.gold_balance`
   - Deploy

3. **Edge Function: tạo `allocate-gold`**
   - Gọi DB function, insert transaction
   - Deploy

4. **Hook + Service layer**
   - Sửa `grailService.buyGold()`, `useBuyGold()`
   - Thêm `grailService.allocateGold()`, `useAllocateGold()`, `useWalletBalance()`

5. **UI: BuyGoldSheet** — bỏ piggyId, move sang `wallet/`

6. **UI: AllocateGoldSheet** — component mới

7. **UI: Wallet screen** — `app/wallet.tsx`

8. **UI: Cập nhật Home + Piggy detail**
   - Home: thêm WalletSummaryCard
   - Piggy detail: đổi Buy Gold → Add Gold (AllocateGoldSheet)

9. **i18n** — thêm strings mới vào en.ts + vi.ts

10. **TypeScript types** — `supabase gen types typescript --local > src/types/database.ts`

---

## Risks & Mitigations

| Risk                                       | Mitigation                                                           |
| ------------------------------------------ | -------------------------------------------------------------------- |
| Race condition khi nhiều allocate cùng lúc | `FOR UPDATE` lock trong `allocate_gold_to_piggy()`                   |
| Client UPDATE gold_balance trực tiếp       | `gold_balance` không có UPDATE policy cho client — chỉ service_role  |
| GRAIL buy thành công nhưng DB update fail  | Transaction record lưu `pending` trước — có audit trail để reconcile |
| Breaking change `buy-gold` (bỏ piggyId)    | Sửa đồng thời Edge Function + client trong cùng 1 PR                 |

---

## Definition of Done

- [ ] Migration chạy thành công trên local và production
- [ ] `buy-gold` credit vào `user_profiles.gold_balance`, không còn piggy_id
- [ ] `allocate-gold` atomic, rollback khi balance không đủ
- [ ] Home hiển thị gold balance của parent
- [ ] Wallet screen hoạt động
- [ ] Piggy detail dùng AllocateGoldSheet thay vì BuyGoldSheet
- [ ] TypeScript strict pass (`npx tsc --noEmit`)
- [ ] i18n đầy đủ cả EN + VI
