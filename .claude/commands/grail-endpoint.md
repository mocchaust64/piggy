Scaffold a new GRAIL API integration for the Gold Piggy Bank app.

⚠️ **CRITICAL**: The GRAIL API key must NEVER appear in the React Native app bundle. All GRAIL calls go through a Supabase Edge Function.

Ask the developer:
1. What operation? (e.g. buy gold, transfer gold, get balance, get price)
2. Input parameters needed
3. Expected response shape

---

## File 1: Supabase Edge Function at `supabase/functions/[function-name]/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GRAIL_API_KEY = Deno.env.get('GRAIL_API_KEY')!
const GRAIL_BASE_URL = Deno.env.get('GRAIL_BASE_URL') ?? 'https://api.oro.io/grail'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Verify caller's Supabase JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonError('Unauthorized', 401)

    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) return jsonError('Invalid session', 401)

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 2. Validate input
    const body = await req.json()

    // 3. Call GRAIL with retry
    const grailResponse = await callGrailWithRetry('[GRAIL_ENDPOINT]', {
      method: 'POST',
      body: JSON.stringify({ /* params */ }),
    })

    // 4. Log transaction — every GRAIL call must be recorded
    await adminClient.from('transactions').insert({
      user_id: user.id,
      piggy_id: body.piggyId,
      type: '[TRANSACTION_TYPE]',
      amount: grailResponse.goldAmount,
      usdc_amount: body.amountUSDC,
      gold_price_at_time: grailResponse.pricePerGram,
      grail_tx_reference: grailResponse.transactionId,
      status: 'completed',
    })

    return jsonResponse({ success: true, data: grailResponse })
  } catch (error) {
    console.error('[function-name] error:', error)
    return jsonError('Internal server error', 500)
  }
})

async function callGrailWithRetry(endpoint: string, options: RequestInit, maxRetries = 3) {
  let lastError: Error
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(`${GRAIL_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${GRAIL_API_KEY}`,
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        },
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(`GRAIL ${res.status}: ${JSON.stringify(body)}`)
      }
      return await res.json()
    } catch (err) {
      lastError = err as Error
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500))
      }
    }
  }
  throw lastError!
}

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const jsonError = (message: string, status: number) =>
  new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
```

---

## File 2: Client service wrapper at `src/services/[featureName]Service.ts`

```typescript
import { supabase } from '@/lib/supabaseClient'

export interface [Operation]Request {
  piggyId: string
  // other params
}

export interface [Operation]Response {
  success: boolean
  // response fields
}

export async function [operationName](params: [Operation]Request): Promise<[Operation]Response> {
  const { data, error } = await supabase.functions.invoke<[Operation]Response>('[function-name]', {
    body: params,
  })

  if (error) {
    if (error.message.includes('insufficient')) throw new Error('Insufficient USDC balance')
    if (error.message.includes('401')) throw new Error('Session expired, please sign in again')
    throw new Error('Something went wrong, please try again')
  }

  return data!
}
```

---

## File 3: TanStack Query hook at `src/hooks/useGrail[Operation].ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { [operationName] } from '@/services/[featureName]Service'

export function useGrail[Operation]() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: [operationName],
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['piggyBalance', variables.piggyId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
```

---

## Post-scaffold checklist

- [ ] `GRAIL_API_KEY` is only in Edge Function env vars — not in any `src/` file
- [ ] Edge Function verifies Supabase JWT before calling GRAIL
- [ ] Every GRAIL operation logs to `transactions` with `grail_tx_reference`
- [ ] Retry logic present (exponential backoff, max 3 attempts)
- [ ] Error messages are user-friendly (localized via i18n)
- [ ] TypeScript types are complete for request and response
