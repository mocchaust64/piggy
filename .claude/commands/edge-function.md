Scaffold a Supabase Edge Function (non-GRAIL) for the Gold Piggy Bank app.

Use `/grail-endpoint` instead if the function needs to call the GRAIL API.

Ask the developer:
1. Function name (kebab-case, e.g. `claim-gift`, `send-notification`, `expire-gifts`)
2. HTTP method (POST / GET)
3. What does this function do?
4. Input parameters
5. Who calls it? (authenticated users / cron job / webhook)

---

## Template: `supabase/functions/[function-name]/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    // Skip this section for cron/webhook functions
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonError('Unauthorized', 401)

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) return jsonError('Invalid session', 401)

    // Service role client for privileged DB operations
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ── Input validation ──────────────────────────────────────────────────────
    const body = await req.json()
    // if (!body.requiredField) return jsonError('Missing required field', 400)

    // ── Business logic ────────────────────────────────────────────────────────
    // TODO: implement

    return jsonResponse({ success: true })
  } catch (error) {
    console.error('[function-name] error:', error)
    return jsonError('Internal server error', 500)
  }
})

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const jsonError = (message: string, status: number) =>
  new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
```

---

## Client invoke wrapper: `src/services/[feature]Service.ts`

```typescript
import { supabase } from '@/lib/supabaseClient'

export async function [functionName]<TRequest, TResponse>(params: TRequest): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke<TResponse>('[function-name]', {
    body: params,
  })

  if (error) throw new Error(error.message ?? 'Something went wrong, please try again')
  return data!
}
```

---

## Special patterns

### Cron / webhook (no user auth):
```typescript
const cronSecret = req.headers.get('x-cron-secret')
if (cronSecret !== Deno.env.get('CRON_SECRET')) return jsonError('Unauthorized', 401)
```

### Atomic DB operation (prevent race conditions):
```typescript
// Use a single UPDATE with RETURNING instead of SELECT then UPDATE
const { data, error } = await adminClient.rpc('claim_gift_atomic', {
  p_claim_code: body.claimCode,
  p_user_id: user.id,
})
```

---

## Local testing

```bash
supabase start
curl -X POST http://localhost:54321/functions/v1/[function-name] \
  -H "Authorization: Bearer [USER_JWT]" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

---

## Checklist

- [ ] Function name is kebab-case
- [ ] CORS headers present on all responses
- [ ] JWT verified before processing (except cron/webhook)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` used only for privileged DB ops, never exposed in responses
- [ ] No sensitive data logged (JWT, API keys, PII)
