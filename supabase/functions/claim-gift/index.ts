/**
 * Edge Function: claim-gift
 *
 * Atomically claims a pending gold gift using a one-time claim_code.
 * This is the most security-critical function in the system.
 *
 * Race condition prevention:
 *   The `pending → transfer_in_progress` state transition is atomic using
 *   a single UPDATE ... WHERE status='pending' RETURNING * query.
 *   If two requests arrive simultaneously, only one will get rows back.
 *   The other receives 0 rows and is rejected immediately.
 *
 * Rate limiting:
 *   Max 10 claim attempts per user per hour (tracked in gift_claim_audit).
 *   Prevents brute-force guessing of claim codes.
 *
 * - Auth: Required (JWT)
 * - Method: POST
 * - Body: { claimCode: string, toPiggyId: string }
 * - Response: { success: true, data: { giftId, goldAmountGrams, templateType } }
 */

import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { errorResponse, withErrorHandler } from '../_shared/errors.ts'
import { requireAuth } from '../_shared/auth.ts'
import { TROY_OUNCE_TO_GRAMS } from '../_shared/grailClient.ts'

const RATE_LIMIT_WINDOW_MINUTES = 60
const RATE_LIMIT_MAX_ATTEMPTS   = 10

interface ClaimGiftBody {
  claimCode: string
  toPiggyId: string
}

type AuditResult =
  | 'success'
  | 'already_claimed'
  | 'expired'
  | 'invalid_code'
  | 'in_progress'
  | 'rate_limited'

async function insertAuditLog(
  adminClient: ReturnType<import('../_shared/auth.ts').requireAuth extends (req: Request) => Promise<infer T> ? T : never>,
  params: {
    giftId: string | null
    userId: string
    result: AuditResult
  }
) {
  // Type simplification for audit inserts
  await (adminClient as {
    from: (t: string) => {
      insert: (v: object) => Promise<void>
    }
  })
    .from('gift_claim_audit')
    .insert({
      gift_id:                params.giftId,
      attempted_by_user_id:   params.userId,
      result:                 params.result,
    })
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
  let body: ClaimGiftBody
  try {
    body = await req.json()
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Request body must be valid JSON')
  }

  const { claimCode, toPiggyId } = body
  if (!claimCode || typeof claimCode !== 'string') {
    return errorResponse('VALIDATION_ERROR', 'claimCode is required')
  }
  if (!toPiggyId || typeof toPiggyId !== 'string') {
    return errorResponse('VALIDATION_ERROR', 'toPiggyId is required')
  }

  // 3. Rate limiting: check attempts in last 60 minutes
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString()
  const { count: recentAttempts } = await adminClient
    .from('gift_claim_audit')
    .select('id', { count: 'exact', head: true })
    .eq('attempted_by_user_id', userId)
    .gte('attempted_at', windowStart)

  if ((recentAttempts ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS) {
    return errorResponse('RATE_LIMITED', 'Too many claim attempts. Please wait before trying again.')
  }

  // 4. Look up gift by claim code
  const { data: gift, error: giftError } = await adminClient
    .from('gifts')
    .select('id, status, amount, template_type, from_user_id, to_piggy_id, expires_at')
    .eq('claim_code', claimCode.trim().toLowerCase())
    .single()

  if (giftError || !gift) {
    await insertAuditLog(adminClient as never, { giftId: null, userId, result: 'invalid_code' })
    return errorResponse('NOT_FOUND', 'Invalid gift code')
  }

  // 5. Status guards — handle non-pending states clearly
  if (gift.status === 'claimed') {
    await insertAuditLog(adminClient as never, { giftId: gift.id, userId, result: 'already_claimed' })
    return errorResponse('CONFLICT', 'This gift has already been claimed')
  }
  if (gift.status === 'expired' || new Date(gift.expires_at) < new Date()) {
    await insertAuditLog(adminClient as never, { giftId: gift.id, userId, result: 'expired' })
    return errorResponse('CONFLICT', 'This gift has expired')
  }
  if (gift.status === 'transfer_in_progress') {
    await insertAuditLog(adminClient as never, { giftId: gift.id, userId, result: 'in_progress' })
    return errorResponse('CONFLICT', 'Gift claim already in progress. Please wait a moment.')
  }
  if (gift.status !== 'pending') {
    await insertAuditLog(adminClient as never, { giftId: gift.id, userId, result: 'already_claimed' })
    return errorResponse('CONFLICT', `Gift cannot be claimed (status: ${gift.status})`)
  }

  // 6. Verify target piggy belongs to the claiming user
  const { data: targetPiggy, error: piggyError } = await adminClient
    .from('piggies')
    .select('id, user_id')
    .eq('id', toPiggyId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (piggyError || !targetPiggy) {
    return errorResponse('FORBIDDEN', 'Target piggy not found or access denied')
  }

  // 7. ATOMIC LOCK — prevent double-claim
  //    This single UPDATE is the critical race condition guard.
  //    Two simultaneous requests will both try this UPDATE; only one will succeed.
  const { data: lockedGift, error: lockError } = await adminClient
    .from('gifts')
    .update({
      status:             'transfer_in_progress',
      claim_attempts:     gift.amount, // Will be corrected below; using as placeholder
      recipient_user_id:  userId,
    })
    .eq('id', gift.id)
    .eq('status', 'pending')           // ← Guard: only succeeds if still 'pending'
    .gt('expires_at', new Date().toISOString()) // ← Guard: not expired
    .select()
    .single()

  if (lockError || !lockedGift) {
    // Another request beat us to it
    await insertAuditLog(adminClient as never, { giftId: gift.id, userId, result: 'in_progress' })
    return errorResponse('CONFLICT', 'Gift is currently being processed. Please try again in a moment.')
  }

  // 8. Update piggy balance (custodial: trust our DB as source of truth per ADR-011)
  //    In production with GRAIL sub-accounts: call GRAIL transfer endpoint here.
  const goldAmountGrams = gift.amount

  const { error: balanceError } = await adminClient
    .from('piggy_balances')
    .update({
      gold_amount: adminClient.rpc('increment_piggy_balance', {
        p_piggy_id: toPiggyId,
        p_gold_amount: goldAmountGrams,
      }),
      last_updated: new Date().toISOString(),
    })
    .eq('piggy_id', toPiggyId)

  // 9. Finalize gift and create transaction records
  const giftTxRef = `gift-${gift.id}-${Date.now()}`
  const [finishGift, insertReceivedTx, insertSentTx] = await Promise.all([
    adminClient
      .from('gifts')
      .update({
        status:             'claimed',
        claimed_at:         new Date().toISOString(),
        recipient_user_id:  userId,
        grail_tx_reference: giftTxRef,
        claim_attempts:     (lockedGift.claim_attempts ?? 0) + 1,
      })
      .eq('id', gift.id),

    adminClient.from('transactions').insert({
      user_id:            userId,
      piggy_id:           toPiggyId,
      type:               'gift_received',
      amount:             goldAmountGrams,
      grail_tx_reference: giftTxRef,
      status:             'completed',
      metadata:           { giftId: gift.id, claimCode },
    }),

    adminClient.from('transactions').insert({
      user_id:            gift.from_user_id,
      piggy_id:           gift.to_piggy_id,
      type:               'gift_sent',
      amount:             goldAmountGrams,
      grail_tx_reference: giftTxRef,
      status:             'completed',
      metadata:           { giftId: gift.id, claimedBy: userId },
    }),
  ])

  if (finishGift.error) {
    console.error('[claim-gift] CRITICAL: Failed to mark gift as claimed:', finishGift.error.message)
  }
  if (balanceError) {
    console.error('[claim-gift] CRITICAL: Balance update failed:', balanceError.message)
  }

  // 10. Audit log — success
  await insertAuditLog(adminClient as never, { giftId: gift.id, userId, result: 'success' })

  return jsonResponse({
    success: true,
    data: {
      giftId:          gift.id,
      goldAmountGrams,
      templateType:    gift.template_type,
    },
  })
}

Deno.serve(withErrorHandler(handler))
