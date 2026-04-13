import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { errorResponse, withErrorHandler } from '../_shared/errors.ts'
import { requireAuth } from '../_shared/auth.ts'

const MIN_GOLD_GRAMS = 0.0001

interface WithdrawGoldBody {
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

  // 2. Parse body
  let body: WithdrawGoldBody
  try {
    body = (await req.json()) as WithdrawGoldBody
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Request body must be valid JSON')
  }

  const { piggyId, goldAmountGrams } = body

  // 3. Call RPC
  const { error: rpcError } = await adminClient.rpc('withdraw_gold_from_piggy', {
    p_user_id: userId,
    p_piggy_id: piggyId,
    p_amount: goldAmountGrams,
  })

  if (rpcError) {
    const msg = rpcError.message ?? ''
    if (msg.includes('INSUFFICIENT_PIGGY_BALANCE')) {
      return errorResponse('VALIDATION_ERROR', 'Not enough gold in this piggy bank.')
    }
    return errorResponse('DATABASE_ERROR', 'Withdrawal failed.')
  }

  // 4. Log transaction
  await adminClient.from('transactions').insert({
    user_id: userId,
    piggy_id: piggyId,
    type: 'withdraw_from_piggy',
    amount: goldAmountGrams,
    status: 'completed',
    metadata: { source: 'piggy_heist' },
  })

  // 5. Return updated wallet balance
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
      newWalletBalance: profile?.gold_balance ?? 0,
    },
  })
}

Deno.serve(withErrorHandler(handler))
