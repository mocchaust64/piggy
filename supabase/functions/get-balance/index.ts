/**
 * Edge Function: get-balance
 *
 * Returns the caller's active USDC and GOLD balances.
 * On first call (grail_user_id is null), it automatically creates a GRAIL
 * custodial wallet for the user (lazy provisioning pattern).
 *
 * - Auth: Required (JWT)
 * - Method: GET
 * - Response: { success: true, data: { usdcBalance, goldBalanceTotalGrams, grailUserId } }
 */

import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { errorResponse, withErrorHandler } from '../_shared/errors.ts'
import { requireAuth } from '../_shared/auth.ts'
import {
  createGrailUser,
  getGrailUserBalance,
  TROY_OUNCE_TO_GRAMS,
} from '../_shared/grailClient.ts'

const handler = async (req: Request): Promise<Response> => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  // 1. Authenticate
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const { userId, adminClient } = authResult

  // 2. Load user profile to get GRAIL user ID
  const { data: profile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('grail_user_id, grail_deposit_address, grail_usdc_balance')
    .eq('id', userId)
    .single()

  if (profileError) {
    return errorResponse('DATABASE_ERROR', 'Failed to load user profile')
  }

  let grailUserId = profile.grail_user_id

  // 3. Lazy-provision GRAIL custodial wallet if not yet created
  if (!grailUserId) {
    const newUser = await createGrailUser(userId)
    grailUserId = newUser.userPda

    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({
        grail_user_id: grailUserId,
        // Deposit address provisioning — update spec from Oro team when available
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[get-balance] Failed to save new grail_user_id:', updateError.message)
      // Non-fatal: GRAIL wallet exists, we'll retry next call
    }

    console.log(`[get-balance] Created GRAIL wallet for user ${userId}: ${grailUserId}`)
  }

  // 4. Fetch live balance from GRAIL
  const grailUser = await getGrailUserBalance(grailUserId)

  const usdcBalance = grailUser.balancesManagedByProgram.usdc.amount
  // GRAIL reports gold in troy ounces → convert to grams for display
  const goldBalanceTroyOz = grailUser.balancesManagedByProgram.gold.amount
  const goldBalanceTotalGrams = parseFloat((goldBalanceTroyOz * TROY_OUNCE_TO_GRAMS).toFixed(6))

  // 5. Cache USDC balance in user_profiles for offline display (fire & forget)
  adminClient
    .from('user_profiles')
    .update({ grail_usdc_balance: usdcBalance })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) console.error('[get-balance] Cache update failed:', error.message)
    })

  return jsonResponse({
    success: true,
    data: {
      usdcBalance,
      goldBalanceTotalGrams,
      grailUserId,
    },
  })
}

Deno.serve(withErrorHandler(handler))
