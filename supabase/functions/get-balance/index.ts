/**
 * Edge Function: get-balance
 *
 * [MOCK MODE] — No GRAIL API key required.
 * Returns balances directly from the database.
 * On first call, auto-generates a mock grail_user_id so the deposit
 * address UI can render.
 *
 * When GRAIL API key is available, replace the mock section with
 * createGrailUser() + getGrailUserBalance() calls.
 *
 * - Auth: Required (JWT)
 * - Method: GET
 * - Response: { success: true, data: { usdcBalance, goldBalanceTotalGrams, grailUserId } }
 */

import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { errorResponse, withErrorHandler } from '../_shared/errors.ts'
import { requireAuth } from '../_shared/auth.ts'

const handler = async (req: Request): Promise<Response> => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  // 1. Authenticate
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const { userId, adminClient } = authResult

  // 2. Load user profile
  let { data: profile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('grail_user_id, grail_deposit_address, grail_usdc_balance, gold_balance')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    console.error('[get-balance] Profile load error:', profileError.message)
    return errorResponse('DATABASE_ERROR', 'Failed to load user profile')
  }

  // Upsert nếu chưa có profile (auth trigger chưa kịp chạy)
  if (!profile) {
    const { data: newProfile, error: upsertError } = await adminClient
      .from('user_profiles')
      .upsert({ id: userId }, { onConflict: 'id' })
      .select('grail_user_id, grail_deposit_address, grail_usdc_balance, gold_balance')
      .single()

    if (upsertError || !newProfile) {
      console.error('[get-balance] Profile upsert failed:', upsertError?.message)
      return errorResponse('DATABASE_ERROR', 'Failed to create user profile')
    }
    profile = newProfile
  }

  // 3. [MOCK] Tạo grail_user_id giả nếu chưa có
  //    Khi có API key thật: thay bằng createGrailUser(userId)
  let grailUserId = profile.grail_user_id
  if (!grailUserId) {
    console.log(`[get-balance] Creating mock wallet for user ${userId}...`)
    // Tạo mock wallet address dạng Solana pubkey (44 ký tự base58)
    const mockWalletId = userId.replace(/-/g, '').slice(0, 32)

    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({
        grail_user_id: mockWalletId,
        grail_deposit_address: mockWalletId,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[get-balance] Failed to save mock grail_user_id:', updateError.message)
      return errorResponse('DATABASE_ERROR', `Failed to create mock wallet: ${updateError.message}`)
    }

    grailUserId = mockWalletId
    console.log(`[get-balance] SUCCESS: Mock wallet created for user ${userId}: ${mockWalletId}`)
  } else {
    console.log(`[get-balance] Existing wallet found for user ${userId}: ${grailUserId}`)
  }

  // 4. [MOCK] Lấy balance từ DB thay vì gọi GRAIL API
  //    Khi có API key thật: thay bằng getGrailUserBalance(grailUserId)
  const usdcBalance = profile.grail_usdc_balance ?? 0
  const goldBalanceTotalGrams = profile.gold_balance ?? 0

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
