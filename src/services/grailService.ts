/**
 * GRAIL Service — thin invoke() wrapper for the mobile app.
 *
 * This file contains ZERO direct GRAIL API calls.
 * All calls go through Supabase Edge Functions via supabase.functions.invoke().
 *
 * The GRAIL_API_KEY never appears in this file or in the app bundle.
 */

import { supabase } from '@/lib/supabaseClient'

// ─── Response types ───────────────────────────────────────────────────────────

export interface GoldPriceData {
  pricePerGram: number
  pricePerTroyOz: number
  currency: string
  unit: string
  fetchedAt: string
}

export interface GoldPriceResponse {
  success: boolean
  data: GoldPriceData
  fromCache: boolean
}

export interface BalanceData {
  usdcBalance: number
  goldBalanceTotalGrams: number
  grailUserId: string
}

export interface BalanceResponse {
  success: boolean
  data: BalanceData
}

export interface BuyGoldData {
  transactionId: string
  grailTxId: string
  goldAmountGrams: number
  newGoldBalance: number
}

export interface AllocateGoldData {
  piggyId: string
  goldAmountGrams: number
  remainingWalletBalance: number
}

export interface AllocateGoldResponse {
  success: boolean
  data: AllocateGoldData
}

export interface BuyGoldResponse {
  success: boolean
  data: BuyGoldData
}

export interface ClaimGiftData {
  giftId: string
  goldAmountGrams: number
  templateType: string | null
}

export interface ClaimGiftResponse {
  success: boolean
  data: ClaimGiftData
}

// ─── Helper ───────────────────────────────────────────────────────────────────

class GrailServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'GrailServiceError'
  }
}

async function invoke<T>(
  functionName: string,
  options?: { body?: object; method?: 'GET' | 'POST' },
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(functionName, {
    body: options?.body,
    method: options?.method ?? (options?.body ? 'POST' : 'GET'),
  })

  if (error) {
    // Supabase wraps Edge Function error responses — try to unwrap them
    type EdgeErrorContext = { json?: () => Promise<{ error?: { code: string; message: string } }> }
    const context = (error as unknown as { context: EdgeErrorContext }).context
    if (context?.json) {
      const parsed = await context.json().catch(() => null)
      if (parsed?.error) {
        throw new GrailServiceError(parsed.error.code, parsed.error.message)
      }
    }
    throw new GrailServiceError('INVOKE_ERROR', error.message)
  }

  if (!data) {
    throw new GrailServiceError('INTERNAL_ERROR', 'Empty response from Edge Function')
  }

  return data
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches the current gold price.
 * Results are cached server-side for 10 minutes.
 */
export async function getGoldPrice(): Promise<GoldPriceData> {
  const res = await invoke<GoldPriceResponse>('get-gold-price', { method: 'GET' })
  return res.data
}

/**
 * Fetches the caller's USDC and gold balances.
 * Provisions a GRAIL custodial wallet on first call.
 */
export async function getBalance(): Promise<BalanceData> {
  const res = await invoke<BalanceResponse>('get-balance', { method: 'GET' })
  return res.data
}

/**
 * Buys gold into the parent's wallet using USDC.
 * Gold lands in user_profiles.gold_balance — not in a piggy directly.
 * Use allocateGold() afterwards to move gold into a specific piggy.
 *
 * @param goldAmountGrams - Amount of gold to buy in grams
 * @param maxUsdcAmount   - Maximum USDC to spend (slippage guard)
 */
export async function buyGold(
  goldAmountGrams: number,
  maxUsdcAmount: number,
): Promise<BuyGoldData> {
  const res = await invoke<BuyGoldResponse>('buy-gold', {
    body: { goldAmountGrams, maxUsdcAmount },
  })
  return res.data
}

/**
 * Allocates gold from the parent's wallet into a specific piggy bank.
 * No GRAIL call — pure DB transfer. Atomic and race-condition safe.
 *
 * @param piggyId         - Target piggy bank ID
 * @param goldAmountGrams - Amount of gold to allocate in grams
 */
export async function allocateGold(
  piggyId: string,
  goldAmountGrams: number,
): Promise<AllocateGoldData> {
  const res = await invoke<AllocateGoldResponse>('allocate-gold', {
    body: { piggyId, goldAmountGrams },
  })
  return res.data
}

/**
 * Withdraws gold from a specific piggy bank back to the parent wallet (Heist).
 *
 * @param piggyId         - Source piggy bank ID
 * @param goldAmountGrams - Amount of gold to withdraw in grams
 */
export async function withdrawFromPiggy(
  piggyId: string,
  goldAmountGrams: number,
): Promise<AllocateGoldData> {
  const res = await invoke<AllocateGoldResponse>('withdraw-from-piggy', {
    body: { piggyId, goldAmountGrams },
  })
  return res.data
}

/**
 * Claims a pending gold gift using a one-time claim code.
 *
 * @param claimCode  - The gift claim code (format: 'heo-xxxxxxxxxx')
 * @param toPiggyId  - The piggy bank to receive the gold
 */
export async function claimGift(claimCode: string, toPiggyId: string): Promise<ClaimGiftData> {
  const res = await invoke<ClaimGiftResponse>('claim-gift', {
    body: { claimCode, toPiggyId },
  })
  return res.data
}

export { GrailServiceError }
