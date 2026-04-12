/**
 * GRAIL API client — server-side only (Supabase Edge Functions).
 *
 * All GRAIL calls go through this module.
 * The API key is read from Deno environment — never from client bundles.
 *
 * Ref: https://docs.grail.oro.finance/
 */

const GRAIL_BASE_URL =
  Deno.env.get('GRAIL_BASE_URL') ?? 'https://oro-tradebook-devnet.up.railway.app'
const GRAIL_API_KEY = Deno.env.get('GRAIL_API_KEY')!

/** USDC amount per 1 troy ounce (used for validation reference only) */
export const TROY_OUNCE_TO_GRAMS = 31.1034768

/**
 * Fetches the current USD to VND exchange rate.
 * Uses a free public API with fallback to a conservative rate.
 */
export async function getVndExchangeRate(): Promise<number> {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error('Exchange rate API failed')
    const data = await res.json()
    return data.rates.VND ?? 25000 // Fallback to ~25k
  } catch (err) {
    console.warn('[GRAIL] Failed to fetch exchange rate, using fallback:', err.message)
    return 25000
  }
}

// ─── Response shape ───────────────────────────────────────────────────────────

export interface GrailCurrentPrice {
  price: string // USD per troy ounce
  unit: string // 'troy_ounce'
  currency: string // 'USD'
  timestamp: string
}

export interface GrailUser {
  userPda: string
  balancesManagedByProgram: {
    gold: { amount: number }
    usdc: { amount: number }
  }
}

export interface GrailBuyEstimate {
  usdcRequired: number
  goldAmount: number
  pricePerGram: number
}

export interface GrailPurchaseResult {
  serializedTx: string // Base64 — must be signed before submission
  transactionId: string
}

// ─── Internal fetch helper ────────────────────────────────────────────────────

const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 500

/**
 * Makes a request to the GRAIL API with automatic retries and exponential backoff.
 * Throws a structured error on failure.
 */
async function grailFetch<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  }

  if (requiresAuth) {
    if (!GRAIL_API_KEY) throw new Error('GRAIL_API_KEY is not configured')
    headers['x-api-key'] = GRAIL_API_KEY
  }

  let lastError: Error = new Error('Unknown GRAIL error')

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    try {
      const res = await fetch(`${GRAIL_BASE_URL}${path}`, {
        ...options,
        headers,
        signal: AbortSignal.timeout(15_000), // 15 s per attempt
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '(no body)')
        throw new Error(`GRAIL HTTP ${res.status}: ${body}`)
      }

      return (await res.json()) as T
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      // Do not retry on 4xx client errors
      if (lastError.message.includes('HTTP 4')) break
      console.warn(`[GRAIL] Attempt ${attempt + 1} failed:`, lastError.message)
    }
  }

  throw lastError
}

// ─── Public API methods ───────────────────────────────────────────────────────

/**
 * Fetches the current gold spot price from GRAIL.
 * This endpoint is public — no API key required.
 *
 * @returns Price per troy ounce in USD
 */
export async function getGoldPrice(): Promise<GrailCurrentPrice> {
  const res = await grailFetch<{ success: boolean; data: GrailCurrentPrice }>(
    '/api/trading/gold/price',
    {},
    false, // public endpoint
  )
  return res.data
}

/**
 * Creates a new custodial user on GRAIL.
 * Called once during onboarding.
 *
 * @param referenceId - Internal user ID (Supabase auth.users.id)
 */
export async function createGrailUser(referenceId: string): Promise<{ userPda: string }> {
  const res = await grailFetch<{ userPda: string }>('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      kycHash: referenceId, // Using our internal ID as KYC reference
      metadata: { referenceId, tags: ['heodat'] },
    }),
  })
  return res
}

/**
 * Fetches a user's GRAIL balance (USDC + GOLD).
 *
 * @param grailUserId - The GRAIL User PDA address
 */
export async function getGrailUserBalance(grailUserId: string): Promise<GrailUser> {
  return grailFetch<GrailUser>(`/api/users/${encodeURIComponent(grailUserId)}`)
}

/**
 * Estimates the USDC cost to buy a given amount of gold.
 *
 * @param goldAmountGrams - Amount of gold to buy in grams
 */
export async function estimateBuyGold(goldAmountGrams: number): Promise<GrailBuyEstimate> {
  // GRAIL API works in troy ounces
  const goldAmountTroyOz = goldAmountGrams / TROY_OUNCE_TO_GRAMS

  const res = await grailFetch<GrailBuyEstimate>('/api/trading/estimate-buy', {
    method: 'POST',
    body: JSON.stringify({ goldAmount: goldAmountTroyOz }),
  })

  return {
    ...res,
    pricePerGram: res.usdcRequired / goldAmountGrams,
  }
}

/**
 * Initiates a gold purchase, returning a serialized transaction that must be signed.
 * The caller (Edge Function) must sign the serializedTx with the partner key before submitting.
 *
 * @param grailUserId     - GRAIL User PDA address
 * @param goldAmountGrams - Gold to buy in grams
 * @param maxUsdcAmount   - Slippage guard: maximum USDC to spend
 */
export async function purchaseGold(
  grailUserId: string,
  goldAmountGrams: number,
  maxUsdcAmount: number,
): Promise<GrailPurchaseResult> {
  const goldAmountTroyOz = goldAmountGrams / TROY_OUNCE_TO_GRAMS

  return grailFetch<GrailPurchaseResult>('/api/trading/purchases/user', {
    method: 'POST',
    body: JSON.stringify({
      userId: grailUserId,
      goldAmount: goldAmountTroyOz,
      maxUsdcAmount,
      co_sign: false,
      userAsFeePayer: true,
    }),
  })
}
