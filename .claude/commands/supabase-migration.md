Write a Supabase database migration for the Gold Piggy Bank app.

Ask the developer:
1. What needs to change? (new table, add column, add index, update policy)
2. Which table(s) are involved?
3. Who should be able to read/write this data? (owner, authenticated users, or Edge Functions only?)

---

## Naming convention

```
supabase/migrations/YYYYMMDDHHMMSS_snake_case_description.sql
```
Example: `20260410120000_add_expires_at_to_gifts.sql`

---

## Security model (must be respected)

| Table | Who can write? |
|-------|---------------|
| piggies | Owner only (`user_id = auth.uid()`) |
| piggy_balances | **service_role only** (Edge Functions) |
| gifts | INSERT: any auth user; UPDATE status: service_role only |
| transactions | **service_role only** (Edge Functions) |
| user_profiles | Owner only |
| gift_claim_audit | **service_role only** |

---

## Migration template

```sql
-- Migration: [short description]
-- Created: [date]

-- ── Schema changes ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS [table_name] (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  -- other columns
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Or add a column:
-- ALTER TABLE [table] ADD COLUMN IF NOT EXISTS [column] text;

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_[table]_user_id ON [table_name] (user_id);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "[table]_select_own" ON [table_name]
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "[table]_insert_own" ON [table_name]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- For service_role-only tables: no INSERT/UPDATE policies for clients.
-- Edge Functions using the service_role key bypass RLS automatically.
```

---

## Rollback template

```sql
-- Rollback: [short description]
-- Pairs with: YYYYMMDDHHMMSS_[description].sql

DROP POLICY IF EXISTS "[table]_select_own" ON [table_name];
DROP INDEX IF EXISTS idx_[table]_user_id;
DROP TABLE IF EXISTS [table_name];
-- Or: ALTER TABLE [table] DROP COLUMN IF EXISTS [column];
```

---

## After writing the migration

1. **Regenerate TypeScript types:**
   ```bash
   supabase gen types typescript --local > src/types/database.ts
   ```

2. **Update Edge Functions** if new columns need to be logged.

3. **Test RLS policies:**
   ```sql
   SET LOCAL role = authenticated;
   SET LOCAL "request.jwt.claims" = '{"sub": "test-user-uuid", "role": "authenticated"}';
   SELECT * FROM [table_name];
   ```

4. **Soft delete** — if the table holds important records (piggies, transactions), use `deleted_at timestamptz` instead of hard delete.
