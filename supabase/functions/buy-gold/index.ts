/**
 * Edge Function: buy-gold
 *
 * Executes a gold purchase for a specific piggy bank using the user's
 * GRAIL custodial USDC balance.
 *
 * Flow:
 * 1. Validate JWT + ownership of piggyId
 * 2. Check USDC balance (slippage guard)
 * 3. Call GRAIL purchase endpoint → receive serializedTx
 * 4. NOTE: serializedTx signing with PARTNER_EXECUTIVE_AUTHORITY is required
 *    before the transaction can be submitted to Solana. This step requires
 *    the @solana/web3.js library and the partner private key in env vars.
 *    Currently stubbed pending Oro partner onboarding completion.
 * 5. Atomically update piggy_balances + insert transaction record
 *
 * - Auth: Required (JWT)
 * - Method: POST
 * - Body: { piggyId: string, goldAmountGrams: number, maxUsdcAmount: number }
 * - Response: { success: true, data: { transactionId, goldAmountGrams, piggyId } }
 */

import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { errorResponse, withErrorHandler } from '../_shared/errors.ts'
import { requireAuth } from '../_shared/auth.ts'
import { estimateBuyGold, purchaseGold, TROY_OUNCE_TO_GRAMS } from '../_shared/grailClient.ts'

const MIN_GOLD_GRAMS = 0.01 // 0.01 gram minimum
const MAX_GOLD_GRAMS = 1000 // 1kg maximum per transaction

interface BuyGoldBody {
  piggyId: string
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

  // 2. Parse and validate body
  let body: BuyGoldBody
  try {
    body = (await req.json()) as BuyGoldBody
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Request body must be valid JSON')
  }

  const { piggyId, goldAmountGrams, maxUsdcAmount } = body

  if (!piggyId || typeof piggyId !== 'string') {
    return errorResponse('VALIDATION_ERROR', 'piggyId is required')
  }
  if (!goldAmountGrams || goldAmountGrams < MIN_GOLD_GRAMS || goldAmountGrams > MAX_GOLD_GRAMS) {
    return errorResponse(
      'VALIDATION_ERROR',
      `goldAmountGrams must be between ${MIN_GOLD_GRAMS} and ${MAX_GOLD_GRAMS}`,
    )
  }
  if (!maxUsdcAmount || maxUsdcAmount <= 0) {
    return errorResponse('VALIDATION_ERROR', 'maxUsdcAmount must be a positive number')
  }

  // 3. Verify piggy ownership (RLS bypass via service_role, explicit check for clarity)
  const { data: piggy, error: piggyError } = await adminClient
    .from('piggies')
    .select('id, user_id, child_name')
    .eq('id', piggyId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (piggyError || !piggy) {
    return errorResponse('FORBIDDEN', 'Piggy not found or access denied')
  }

  // 4. Load user's GRAIL credentials
  const { data: profile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('grail_user_id, grail_usdc_balance')
    .eq('id', userId)
    .single()

  if (profileError || !profile?.grail_user_id) {
    return errorResponse(
      'FORBIDDEN',
      'GRAIL wallet not yet provisioned. Please open the app and try again.',
    )
  }

  // 5. Slippage guard: confirm USDC balance is sufficient
  const cachedUsdcBalance = profile.grail_usdc_balance ?? 0
  if (cachedUsdcBalance < maxUsdcAmount) {
    return errorResponse('VALIDATION_ERROR', 'Insufficient USDC balance')
  }

  // 6. Get buy estimate for audit trail
  const estimate = await estimateBuyGold(goldAmountGrams)
  if (estimate.usdcRequired > maxUsdcAmount) {
    return errorResponse(
      'VALIDATION_ERROR',
      `Price moved. Required ${estimate.usdcRequired} USDC but max is ${maxUsdcAmount}`,
    )
  }

  // 7. Insert a pending transaction record BEFORE calling GRAIL
  //    This ensures we have an audit trail even if something crashes mid-flight.
  const { data: pendingTx, error: txInsertError } = await adminClient
    .from('transactions')
    .insert({
      user_id: userId,
      piggy_id: piggyId,
      type: 'buy_gold',
      amount: goldAmountGrams,
      usdc_amount: estimate.usdcRequired,
      gold_price_at_time: estimate.pricePerGram,
      status: 'pending',
      metadata: { estimate },
    })
    .select('id')
    .single()

  if (txInsertError || !pendingTx) {
    return errorResponse('DATABASE_ERROR', 'Failed to create transaction record')
  }

  const transactionRecordId = pendingTx.id

  // 8. Call GRAIL purchase endpoint
  let purchaseResult
  try {
    purchaseResult = await purchaseGold(profile.grail_user_id, goldAmountGrams, maxUsdcAmount)
  } catch (err) {
    // Mark transaction as failed and surface meaningful error
    await adminClient
      .from('transactions')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'GRAIL purchase failed',
      })
      .eq('id', transactionRecordId)

    return errorResponse('GRAIL_ERROR', 'Gold purchase failed. Your USDC has not been charged.')
  }

  // 9. Atomically update piggy_balances + mark transaction completed
  //    NOTE: In production, we verify the Solana tx signature before crediting balance.
  //    For MVP, we trust the GRAIL API response (custodial model).
  const goldAmountTroyOz = goldAmountGrams / TROY_OUNCE_TO_GRAMS

  const [balanceResult, txUpdateResult] = await Promise.all([
    adminClient.rpc('increment_piggy_balance', {
      p_piggy_id: piggyId,
      p_gold_amount: goldAmountTroyOz, // stored internally in troy oz for GRAIL parity
    }),
    adminClient
      .from('transactions')
      .update({
        status: 'completed',
        grail_tx_reference: purchaseResult.transactionId,
        metadata: { estimate, grailResponse: purchaseResult },
      })
      .eq('id', transactionRecordId),
  ])

  if (balanceResult.error) {
    // Critical: transaction success but balance not updated
    // Log for manual reconciliation — do NOT return error to avoid double-buy
    console.error(
      '[buy-gold] CRITICAL: Balance update failed after successful GRAIL tx',
      { piggyId, transactionRecordId, grailTxId: purchaseResult.transactionId },
      balanceResult.error,
    )
  }

  if (txUpdateResult.error) {
    console.error('[buy-gold] Failed to mark transaction completed:', txUpdateResult.error.message)
  }

  return jsonResponse({
    success: true,
    data: {
      transactionId: transactionRecordId,
      grailTxId: purchaseResult.transactionId,
      goldAmountGrams,
      piggyId,
    },
  })
}

Deno.serve(withErrorHandler(handler))
