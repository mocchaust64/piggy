/**
 * Edge Function: get-gold-price
 *
 * Returns the current gold price per gram in USD and VND.
 * Price is fetched from a free public metals API (no API key needed).
 * Results are cached in `price_cache` for 10 minutes.
 *
 * [MOCK MODE] Fallback: nếu fetch thất bại dùng giá hardcode hợp lý.
 * Khi có GRAIL API key: bổ sung getGoldPrice() từ grailClient làm nguồn chính.
 *
 * - Auth: Not required
 * - Method: GET
 * - Response: { success: true, data: { pricePerGramUsd, pricePerGramVnd, vndRate, history[] } }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { withErrorHandler } from '../_shared/errors.ts'
import { getVndExchangeRate, TROY_OUNCE_TO_GRAMS } from '../_shared/grailClient.ts'

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 phút
const CACHE_KEY = 'gold_price_current'

// Giá vàng fallback (troy oz) khi không fetch được — cập nhật thủ công nếu cần
const FALLBACK_GOLD_PRICE_USD_PER_OZ = 3300

async function fetchGoldPricePerOz(): Promise<number> {
  // metals-api.com public endpoint (không cần key, giới hạn 10 req/month trên free tier)
  // metals.live là public hoàn toàn
  try {
    const res = await fetch('https://metals.live/api/spot?metal=gold&currency=USD', {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`metals.live HTTP ${res.status}`)
    const data = await res.json()
    // Response: [{ metal: "gold", price: 3300.xx }] hoặc { price: 3300.xx }
    const price = Array.isArray(data) ? data[0]?.price : data?.price
    if (price && price > 0) return parseFloat(price)
    throw new Error('Invalid price shape')
  } catch (err) {
    console.warn('[get-gold-price] metals.live failed, trying backup:', err.message)
  }

  // Backup: frankfurter.app không có metals, thử goldapi.io public
  try {
    const res = await fetch('https://www.goldapi.io/api/XAU/USD', {
      headers: { 'x-access-token': 'goldapi-demo' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`goldapi HTTP ${res.status}`)
    const data = await res.json()
    if (data?.price && data.price > 0) return parseFloat(data.price)
    throw new Error('Invalid price shape')
  } catch (err) {
    console.warn('[get-gold-price] goldapi.io failed, using fallback:', err.message)
  }

  return FALLBACK_GOLD_PRICE_USD_PER_OZ
}

const handler = async (req: Request): Promise<Response> => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // 1. Kiểm tra cache
  const { data: cachedCurrent } = await adminClient
    .from('price_cache')
    .select('data, cached_at')
    .eq('id', CACHE_KEY)
    .maybeSingle()

  let finalData: Record<string, unknown> | null = null
  let fromCache = false

  if (cachedCurrent) {
    const ageMs = Date.now() - new Date(cachedCurrent.cached_at).getTime()
    if (ageMs < CACHE_TTL_MS) {
      finalData = cachedCurrent.data as Record<string, unknown>
      fromCache = true
    }
  }

  if (!finalData) {
    // 2. Fetch giá mới
    const [pricePerOz, vndRate] = await Promise.all([fetchGoldPricePerOz(), getVndExchangeRate()])

    const pricePerGramUsd = pricePerOz / TROY_OUNCE_TO_GRAMS
    const pricePerGramVnd = pricePerGramUsd * vndRate

    finalData = {
      pricePerGramUsd: parseFloat(pricePerGramUsd.toFixed(4)),
      pricePerGramVnd: Math.round(pricePerGramVnd),
      vndRate,
      currency: 'USD',
      unit: 'gram',
      fetchedAt: new Date().toISOString(),
    }

    // 3. Lưu cache + history (fire and forget)
    const now = new Date().toISOString()
    adminClient
      .from('price_cache')
      .upsert({ id: CACHE_KEY, data: finalData, cached_at: now })
      .then(() =>
        adminClient.from('price_history').insert({
          price_usd: finalData!.pricePerGramUsd as number,
          price_vnd: finalData!.pricePerGramVnd as number,
          recorded_at: now,
        }),
      )
      .catch((err) => console.error('[get-gold-price] Cache save failed:', err.message))
  }

  // 4. Lấy lịch sử 7 ngày cho biểu đồ
  const { data: history } = await adminClient
    .from('price_history')
    .select('price_usd, price_vnd, recorded_at')
    .order('recorded_at', { ascending: true })
    .limit(50)

  return jsonResponse({
    success: true,
    data: {
      ...finalData,
      history: history ?? [],
    },
    fromCache,
  })
}

Deno.serve(withErrorHandler(handler))
