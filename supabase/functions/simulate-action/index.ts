/**
 * Edge Function: simulate-action
 *
 * Provides "Admin/Dev" tools to simulate actions like depositing USDC
 * or creating a mock wallet without needing the real GRAIL API.
 *
 * - Auth: Required (JWT)
 * - Method: POST
 * - Body: { action: 'deposit' | 'create_wallet', amount?: number }
 */

import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { errorResponse, withErrorHandler } from '../_shared/errors.ts'
import { requireAuth } from '../_shared/auth.ts'

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
  let body: { action: string; amount?: number }
  try {
    body = await req.json()
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Request body must be valid JSON')
  }

  const { action, amount } = body

  if (action === 'deposit') {
    const depositAmount = amount ?? 100 // Default 100 USDC
    console.log(`[simulate-action] Depositing ${depositAmount} USDC for user ${userId}`)

    // Get current balance
    const { data: profile, error: loadError } = await adminClient
      .from('user_profiles')
      .select('grail_usdc_balance')
      .eq('id', userId)
      .single()

    if (loadError) {
      return errorResponse('DATABASE_ERROR', 'Failed to load profile')
    }

    const newBalance = (profile.grail_usdc_balance ?? 0) + depositAmount

    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({ grail_usdc_balance: newBalance })
      .eq('id', userId)

    if (updateError) {
      return errorResponse('DATABASE_ERROR', `Deposit failed: ${updateError.message}`)
    }

    // Log the transaction so it appears in history
    await adminClient.from('transactions').insert({
      user_id: userId,
      type: 'deposit_usdc',
      amount: depositAmount,
      status: 'completed',
      metadata: { source: 'phantom_signature' },
    })

    return jsonResponse({
      success: true,
      data: { message: `Successfully deposited ${depositAmount} USDC`, newBalance },
    })
  }

  if (action === 'create_wallet') {
    console.log(`[simulate-action] Forcing mock wallet creation for user ${userId}`)
    const mockWalletId = userId.replace(/-/g, '').slice(0, 32)

    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({
        grail_user_id: mockWalletId,
        grail_deposit_address: mockWalletId,
      })
      .eq('id', userId)

    if (updateError) {
      return errorResponse('DATABASE_ERROR', `Wallet creation failed: ${updateError.message}`)
    }

    return jsonResponse({
      success: true,
      data: { message: 'Mock wallet created', grailUserId: mockWalletId },
    })
  }

  return errorResponse('VALIDATION_ERROR', `Unknown action: ${action}`)
}

Deno.serve(withErrorHandler(handler))
