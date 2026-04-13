/**
 * Edge Function: buy-gold
 *
 * [MOCK MODE] — No GRAIL API key required.
 * Simulates a gold purchase by:
 * 1. Checking USDC balance in DB
 * 2. Deducting USDC + crediting gold directly in DB
 * 3. Logging a completed transaction
 *
 * When GRAIL API key is available, replace the mock section with
 * estimateBuyGold() + purchaseGold() calls.
 *
 * - Auth: Required (JWT)
 * - Method: POST
 * - Body: { goldAmountGrams: number, maxUsdcAmount: number }
 * - Response: { success: true, data: { transactionId, goldAmountGrams, newGoldBalance } }
 */

import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { errorResponse, withErrorHandler } from '../_shared/errors.ts'
import { requireAuth } from '../_shared/auth.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MIN_GOLD_GRAMS = 0.01
const MAX_GOLD_GRAMS = 1000

interface BuyGoldBody {
  goldAmountGrams: number
  maxUsdcAmount: number
}

const handler = async (req: Request): Promise<Response> => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  if (req.method !== 'POST') {
    return errorResponse('VALIDATION_ERROR', 'Method not allowed')
  }

  // 1. Authenticate
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const { userId, adminClient } = authResult

  // 2. Parse và validate body
  let body: BuyGoldBody
  try {
    body = (await req.json()) as BuyGoldBody
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Request body must be valid JSON')
  }

  const { goldAmountGrams, maxUsdcAmount } = body

  if (!goldAmountGrams || goldAmountGrams < MIN_GOLD_GRAMS || goldAmountGrams > MAX_GOLD_GRAMS) {
    return errorResponse(
      'VALIDATION_ERROR',
      `goldAmountGrams must be between ${MIN_GOLD_GRAMS} and ${MAX_GOLD_GRAMS}`,
    )
  }
  if (!maxUsdcAmount || maxUsdcAmount <= 0) {
    return errorResponse('VALIDATION_ERROR', 'maxUsdcAmount must be a positive number')
  }

  // 3. Load profile
  const { data: profile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('grail_usdc_balance, gold_balance')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return errorResponse('DATABASE_ERROR', 'Failed to load user profile')
  }

  // 4. Kiểm tra số dư USDC
  const currentUsdc = profile.grail_usdc_balance ?? 0
  if (currentUsdc < maxUsdcAmount) {
    return errorResponse('VALIDATION_ERROR', 'Insufficient USDC balance')
  }

  // 5. Lấy giá vàng từ price_cache để ghi vào audit trail
  const priceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: priceCache } = await priceClient
    .from('price_cache')
    .select('data')
    .eq('id', 'gold_price_current')
    .maybeSingle()

  const cachedPrice = priceCache?.data as { pricePerGramUsd?: number } | null
  const pricePerGram = cachedPrice?.pricePerGramUsd ?? maxUsdcAmount / goldAmountGrams

  // 6. [MOCK] Tính toán simulation — không gọi GRAIL
  //    Khi có API key: thay bằng estimateBuyGold() + purchaseGold()
  const usdcToDeduct = parseFloat((pricePerGram * goldAmountGrams).toFixed(6))
  const mockTxReference = `mock_${Date.now()}_${userId.slice(0, 8)}`

  // 7. Ghi pending transaction
  const { data: pendingTx, error: txInsertError } = await adminClient
    .from('transactions')
    .insert({
      user_id: userId,
      piggy_id: null,
      type: 'buy_gold',
      amount: goldAmountGrams,
      usdc_amount: usdcToDeduct,
      gold_price_at_time: pricePerGram,
      status: 'pending',
      metadata: { mock: true, pricePerGram, usdcToDeduct },
    })
    .select('id')
    .single()

  if (txInsertError || !pendingTx) {
    return errorResponse('DATABASE_ERROR', 'Failed to create transaction record')
  }

  const transactionRecordId = pendingTx.id

  // 8. Cập nhật balance atomically
  const newGoldBalance = parseFloat(((profile.gold_balance ?? 0) + goldAmountGrams).toFixed(6))
  const newUsdcBalance = parseFloat((currentUsdc - usdcToDeduct).toFixed(6))

  const [balanceResult, txUpdateResult] = await Promise.all([
    adminClient
      .from('user_profiles')
      .update({
        gold_balance: newGoldBalance,
        grail_usdc_balance: newUsdcBalance,
      })
      .eq('id', userId),
    adminClient
      .from('transactions')
      .update({
        status: 'completed',
        grail_tx_reference: mockTxReference,
      })
      .eq('id', transactionRecordId),
  ])

  if (balanceResult.error) {
    console.error('[buy-gold] CRITICAL: balance update failed:', balanceResult.error.message)
    await adminClient
      .from('transactions')
      .update({ status: 'failed', error_message: 'Balance update failed' })
      .eq('id', transactionRecordId)
    return errorResponse('DATABASE_ERROR', 'Purchase failed. Please try again.')
  }

  if (txUpdateResult.error) {
    console.error('[buy-gold] Failed to mark tx completed:', txUpdateResult.error.message)
  }

  return jsonResponse({
    success: true,
    data: {
      transactionId: transactionRecordId,
      grailTxId: mockTxReference,
      goldAmountGrams,
      newGoldBalance,
    },
  })
}

Deno.serve(withErrorHandler(handler))
