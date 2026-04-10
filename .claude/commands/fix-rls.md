Debug or write Row Level Security policies for the Gold Piggy Bank app.

Ask the developer:
1. Which table has the issue?
2. Which operation is failing? (SELECT / INSERT / UPDATE / DELETE)
3. Who is performing it? (authenticated user / edge function / anon)
4. Exact error message (if any)
5. What access pattern is needed?

---

## Security model

**Default DENY** — after enabling RLS, all access is denied until a policy explicitly grants it.

| Table | Client SELECT | Client INSERT | Client UPDATE | service_role write |
|-------|--------------|--------------|--------------|-------------------|
| user_profiles | owner | owner | owner | bypass RLS |
| piggies | owner | owner | owner | bypass RLS |
| piggy_balances | piggy owner | ❌ | ❌ | ✅ only |
| gifts | sender or piggy owner | auth users | ❌ | ✅ only |
| transactions | owner | ❌ | ❌ | ✅ only |
| gift_claim_audit | ❌ | ❌ | ❌ | ✅ only |
| price_cache | authenticated | ❌ | ❌ | ✅ only |

**service_role** (Edge Functions) bypasses RLS entirely — no policy needed for them.

---

## Policy templates

### 1. Owner-only access (most common)

```sql
CREATE POLICY "[table]_select_own" ON [table]
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "[table]_insert_own" ON [table]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "[table]_update_own" ON [table]
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 2. Gift — sender or recipient piggy owner

```sql
CREATE POLICY "gifts_select_sender_or_owner" ON gifts
  FOR SELECT USING (
    auth.uid() = from_user_id
    OR auth.uid() = (SELECT user_id FROM piggies WHERE id = to_piggy_id)
  );
```

### 3. Gift INSERT — any authenticated user (to send gifts)

```sql
CREATE POLICY "gifts_insert_authenticated" ON gifts
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id
    AND status = 'pending'
    AND expires_at > now()
    AND amount > 0
  );
```

### 4. Read-only for owner (piggy_balances, transactions)

```sql
-- Owner can read, but writes come only from service_role Edge Functions
CREATE POLICY "piggy_balances_select_own" ON piggy_balances
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM piggies WHERE id = piggy_id)
  );
-- No INSERT/UPDATE policy → only service_role can write
```

---

## Debugging RLS errors

```sql
-- Check existing policies on a table
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = '[table_name]';

-- Test as an authenticated user (Supabase SQL editor)
SET LOCAL role = authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';
SELECT * FROM [table_name];
```

---

## When to use an Edge Function instead of RLS

Use `service_role` in an Edge Function when:
1. The operation reads data belonging to another user (e.g. gift claim needs the recipient's piggy)
2. An atomic operation is required (e.g. `pending → transfer_in_progress → claimed`)
3. Complex validation is needed before writing
4. An external API call (GRAIL) must happen atomically with the DB write

**Rule of thumb**: if writing the RLS policy requires a multi-level sub-query or feels complex → push the operation into an Edge Function.

---

## Checklist

- [ ] RLS is enabled on the table (`ALTER TABLE x ENABLE ROW LEVEL SECURITY`)
- [ ] Policy tested in SQL editor with `SET LOCAL role = authenticated`
- [ ] `piggy_balances` and `transactions` have no INSERT/UPDATE policies for clients
- [ ] `gift_claim_audit` has no policies for clients
- [ ] Policy names are descriptive (e.g. `gifts_select_sender_or_owner`)
