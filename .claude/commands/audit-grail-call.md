Audit GRAIL API integration code for security compliance in the Gold Piggy Bank app.

The developer should paste the code to review into the conversation.

---

## Audit checklist

### 🔴 CRITICAL — Fix immediately

**C1. GRAIL API key in the mobile app**
Search for `GRAIL_API_KEY`, `GRAIL_SECRET`, `Authorization: Bearer` in:
- `src/`, `app/`, `components/`, `hooks/`, `services/`

If found in any of these → **CRITICAL VIOLATION**. Move the call to a Supabase Edge Function.

**C2. Direct GRAIL API call from React Native**
Search for `fetch('https://api.oro.io`, `axios.*api.oro.io` in `src/` or `app/`.

If found → **CRITICAL VIOLATION**. Replace with:
```typescript
const { data, error } = await supabase.functions.invoke('[function-name]', { body: params })
```

**C3. Private keys or wallet credentials anywhere in code**
Search for `privateKey`, `secretKey`, `seedPhrase`, `mnemonic`, `keypair`.
Must never appear in any file.

---

### 🟡 WARNING — Should fix

**W1. Transaction not logged**
After every successful GRAIL call, an insert to `transactions` with `grail_tx_reference` is required.
Missing → no audit trail, no user support capability.

**W2. No retry logic**
GRAIL is an external service. Without exponential backoff (3 retries), a single timeout causes user-visible errors.

**W3. Missing server-side validation**
USDC balance must be checked server-side before calling GRAIL.
Client-side-only validation → easily bypassed.

**W4. Race condition in gift claim**
The transition `pending → claimed` must be atomic. Two queries (check then update) → double-claim possible.

Fix: single atomic UPDATE:
```sql
UPDATE gifts SET status = 'transfer_in_progress'
WHERE id = $1 AND status = 'pending' AND expires_at > now()
RETURNING *
-- 0 rows = already claimed or expired
```

**W5. Missing JWT verification in Edge Function**
Every Edge Function must verify the Supabase JWT before processing.
Missing → any unauthenticated request can trigger the function.

---

### 🔵 SUGGESTION — Nice to have

**S1. Error messages not localized**
User-facing errors should go through the i18n system (`t('common.error')`).
Technical/GRAIL errors should only be logged server-side.

**S2. No compensating transaction on failure**
If GRAIL call succeeds but DB write fails → inconsistent state.
Log the failed state to `transactions` with `status: 'failed'` and `error_message`.

**S3. Floating-point arithmetic on financial amounts**
Do not use JavaScript floats for gold/USDC calculations.
Use integer micro-units or a `Decimal` library.

---

## Output format

```
## GRAIL Security Audit

### 🔴 Critical Issues ([count])
[list with file:line references]

### 🟡 Warnings ([count])
[list]

### 🔵 Suggestions ([count])
[list]

### Corrected code
[show fixed code for every CRITICAL issue]
```

---

## Reference: correct vs incorrect patterns

### ❌ Wrong — direct GRAIL call from mobile
```typescript
// src/services/grailService.ts
export async function buyGold(piggyId: string, amount: number) {
  return fetch('https://api.oro.io/grail/buy', {
    headers: { 'Authorization': `Bearer ${process.env.GRAIL_API_KEY}` }, // ❌ key exposed
    body: JSON.stringify({ piggyId, amount }),
  }).then(r => r.json())
}
```

### ✅ Correct — through Edge Function
```typescript
// src/services/grailService.ts
export async function buyGold(piggyId: string, amountUSDC: number) {
  const { data, error } = await supabase.functions.invoke('buy-gold', {
    body: { piggyId, amountUSDC },
  })
  if (error) throw new Error('Unable to buy gold, please try again')
  return data
}

// supabase/functions/buy-gold/index.ts
const GRAIL_API_KEY = Deno.env.get('GRAIL_API_KEY')! // ✅ server-side only
```
