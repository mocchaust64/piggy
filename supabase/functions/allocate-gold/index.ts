/**
 * Edge Function: allocate-gold
 *
 * Transfers gold from the parent's wallet (user_profiles.gold_balance)
 * into a specific piggy bank (piggy_balances.gold_amount).
 *
 * This is a pure DB operation — no GRAIL API call is made.
 * GRAIL sees only the parent's total balance; the per-piggy split
 * is tracked internally (ADR-011).
 *
 * The transfer is atomic via the allocate_gold_to_piggy() Postgres function,
 * which uses SELECT FOR UPDATE to prevent race conditions.
 *
 * - Auth: Required (JWT)
 * - Method: POST
 * - Body: { piggyId: string, goldAmountGrams: number }
 * - Response: { success: true, data: { piggyId, goldAmountGrams, remainingWalletBalance } }
 */

import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { errorResponse, withErrorHandler } from '../_shared/errors.ts'
import { requireAuth } from '../_shared/auth.ts'

const MIN_GOLD_GRAMS = 0.0001 // 0.1 mg minimum (smallest meaningful unit)

interface AllocateGoldBody {
  piggyId: string
  goldAmountGrams: number
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
  let body: AllocateGoldBody
  try {
    body = (await req.json()) as AllocateGoldBody
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Request body must be valid JSON')
  }

  const { piggyId, goldAmountGrams } = body

  if (!piggyId || typeof piggyId !== 'string') {
    return errorResponse('VALIDATION_ERROR', 'piggyId is required')
  }
  if (!goldAmountGrams || goldAmountGrams < MIN_GOLD_GRAMS) {
    return errorResponse('VALIDATION_ERROR', `goldAmountGrams must be at least ${MIN_GOLD_GRAMS}`)
  }

  // 3. Call atomic Postgres function
  //    allocate_gold_to_piggy() handles:
  //    - ownership check (piggy belongs to user)
  //    - balance check (user has enough gold)
  //    - atomic debit/credit in one transaction
  //    - raises named exceptions on failure
  const { error: rpcError } = await adminClient.rpc('allocate_gold_to_piggy', {
    p_user_id: userId,
    p_piggy_id: piggyId,
    p_amount: goldAmountGrams,
  })

  if (rpcError) {
    const msg = rpcError.message ?? ''

    if (msg.includes('INSUFFICIENT_GOLD_BALANCE')) {
      return errorResponse('VALIDATION_ERROR', 'Insufficient gold in wallet. Buy more gold first.')
    }
    if (msg.includes('PIGGY_NOT_FOUND')) {
      return errorResponse('FORBIDDEN', 'Piggy not found or access denied')
    }
    if (msg.includes('PIGGY_BALANCE_NOT_FOUND')) {
      return errorResponse('DATABASE_ERROR', 'Piggy balance record missing. Contact support.')
    }

    console.error('[allocate-gold] RPC error:', rpcError)
    return errorResponse('DATABASE_ERROR', 'Allocation failed. Please try again.')
  }

  // 4. Log transaction record
  const { error: txError } = await adminClient.from('transactions').insert({
    user_id: userId,
    piggy_id: piggyId,
    type: 'allocate_to_piggy',
    amount: goldAmountGrams,
    usdc_amount: null,
    gold_price_at_time: null,
    status: 'completed',
    metadata: { source: 'parent_wallet' },
  })

  if (txError) {
    // Non-critical — allocation already succeeded, just log
    console.error('[allocate-gold] Failed to insert transaction record:', txError.message)
  }

  // 5. Fetch updated wallet balance to return to client
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('gold_balance')
    .eq('id', userId)
    .single()

  return jsonResponse({
    success: true,
    data: {
      piggyId,
      goldAmountGrams,
      remainingWalletBalance: profile?.gold_balance ?? 0,
    },
  })
}

Deno.serve(withErrorHandler(handler))
