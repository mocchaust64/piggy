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
import { getGoldPrice, getVndExchangeRate, TROY_OUNCE_TO_GRAMS } from '../_shared/grailClient.ts'

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const CACHE_KEY = 'gold_price_current'

const handler = async (req: Request): Promise<Response> => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // 1. Check cache for current price
  const { data: cachedCurrent } = await adminClient
    .from('price_cache')
    .select('data, cached_at')
    .eq('id', CACHE_KEY)
    .single()

  let finalData: any = null
  let fromCache = false

  if (cachedCurrent) {
    const ageMs = Date.now() - new Date(cachedCurrent.cached_at).getTime()
    if (ageMs < CACHE_TTL_MS) {
      finalData = cachedCurrent.data
      fromCache = true
    }
  }

  if (!finalData) {
    // 2. Fetch fresh price from GRAIL + Exchange Rate
    try {
      const [grailPrice, vndRate] = await Promise.all([getGoldPrice(), getVndExchangeRate()])

      const pricePerTroyOz = parseFloat(grailPrice.price)
      if (isNaN(pricePerTroyOz) || pricePerTroyOz <= 0) {
        throw new Error('Invalid price from GRAIL')
      }

      const pricePerGramUsd = pricePerTroyOz / TROY_OUNCE_TO_GRAMS
      const pricePerGramVnd = pricePerGramUsd * vndRate

      finalData = {
        pricePerGramUsd: parseFloat(pricePerGramUsd.toFixed(4)),
        pricePerGramVnd: Math.round(pricePerGramVnd),
        vndRate: vndRate,
        currency: 'USD',
        unit: 'gram',
        fetchedAt: grailPrice.timestamp,
      }

      // 3. Update cache & history (fire and forget)
      const now = new Date().toISOString()
      adminClient
        .from('price_cache')
        .upsert({ id: CACHE_KEY, data: finalData, cached_at: now })
        .then(() => {
          // Only save to history if it's a fresh fetch
          return adminClient.from('price_history').insert({
            price_usd: finalData.pricePerGramUsd,
            price_vnd: finalData.pricePerGramVnd,
            recorded_at: now,
          })
        })
        .catch((err) => console.error('[get-gold-price] Save failed:', err.message))
    } catch (err) {
      return errorResponse('FETCH_ERROR', err.message)
    }
  }

  // 4. Always fetch 7-day history for the chart
  const { data: history } = await adminClient
    .from('price_history')
    .select('price_usd, price_vnd, recorded_at')
    .order('recorded_at', { ascending: true })
    .limit(50) // Enough for a 7-day sparkline (e.g., daily or 6h intervals)

  return jsonResponse({
    success: true,
    data: {
      ...finalData,
      history: history || [],
    },
    fromCache,
  })
}

Deno.serve(withErrorHandler(handler))
