/**
 * Edge Function: get-gold-price
 *
 * Returns the current gold price (per gram in USD) and cached history.
 * Results are cached in the `price_cache` table for 10 minutes to avoid
 * hammering the GRAIL API when many users open the app simultaneously.
 *
 * - Auth: Not required (price is public data)
 * - Method: GET
 * - Response: { success: true, data: { pricePerGram, pricePerTroyOz, currency, cachedAt } }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { errorResponse, withErrorHandler } from '../_shared/errors.ts'
import { getGoldPrice, TROY_OUNCE_TO_GRAMS } from '../_shared/grailClient.ts'

const CACHE_TTL_MS = 10 * 60 * 1000  // 10 minutes
const CACHE_KEY = 'gold_price_current'

const handler = async (req: Request): Promise<Response> => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // 1. Check cache
  const { data: cached } = await adminClient
    .from('price_cache')
    .select('data, cached_at')
    .eq('id', CACHE_KEY)
    .single()

  if (cached) {
    const ageMs = Date.now() - new Date(cached.cached_at).getTime()
    if (ageMs < CACHE_TTL_MS) {
      return jsonResponse({ success: true, data: cached.data, fromCache: true })
    }
  }

  // 2. Fetch fresh price from GRAIL
  const grailPrice = await getGoldPrice()

  const pricePerTroyOz = parseFloat(grailPrice.price)
  if (isNaN(pricePerTroyOz) || pricePerTroyOz <= 0) {
    return errorResponse('GRAIL_ERROR', 'Received invalid price from GRAIL')
  }

  const pricePerGram = pricePerTroyOz / TROY_OUNCE_TO_GRAMS

  const responseData = {
    pricePerGram:    parseFloat(pricePerGram.toFixed(4)),
    pricePerTroyOz: pricePerTroyOz,
    currency:        grailPrice.currency,
    unit:            'gram',
    fetchedAt:       grailPrice.timestamp,
  }

  // 3. Upsert cache (fire and forget — don't block the response)
  adminClient
    .from('price_cache')
    .upsert({ id: CACHE_KEY, data: responseData, cached_at: new Date().toISOString() })
    .then(({ error }) => {
      if (error) console.error('[get-gold-price] Cache upsert failed:', error.message)
    })

  return jsonResponse({ success: true, data: responseData, fromCache: false })
}

Deno.serve(withErrorHandler(handler))
