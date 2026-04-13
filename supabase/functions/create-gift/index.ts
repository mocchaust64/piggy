/**
 * Edge Function: create-gift
 *
 * Creates a gold gift from the sender's wallet balance (mock/DB-level escrow).
 * Gold is debited immediately from gold_balance; recipient claims via link.
 *
 * - Auth: Required (JWT)
 * - Method: POST
 * - Body: { amountGrams, templateType, message, recipientType, recipientIdentifier }
 * - Response: { success: true, data: { claimCode, shareUrl, giftId } }
 */

import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { errorResponse, withErrorHandler } from '../_shared/errors.ts'
import { requireAuth } from '../_shared/auth.ts'

/** Claim code prefix for easy identification */
const CODE_PREFIX = 'heo'
const GIFT_EXPIRY_DAYS = 30
const MIN_GOLD_GRAMS = 0.0001

type RecipientType = 'email' | 'phone' | 'wallet'
type TemplateType = 'tet' | 'sinhnhat' | 'cuoihoi' | 'thoinhoi'

interface CreateGiftBody {
  amountGrams: number
  templateType: TemplateType
  message: string
  recipientType: RecipientType
  recipientIdentifier: string
}

/** Generate a random nanoid-style claim code */
function generateClaimCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const randomPart = Array.from(
    { length: 10 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('')
  return `${CODE_PREFIX}-${randomPart}`
}

/** Basic validation per recipient type */
function validateRecipient(type: RecipientType, identifier: string): string | null {
  const trimmed = identifier.trim()
  if (!trimmed) return 'Recipient identifier is required'

  if (type === 'email') {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(trimmed)) return 'Invalid email address'
  } else if (type === 'phone') {
    const phoneRe = /^\+?[0-9]{9,15}$/
    if (!phoneRe.test(trimmed.replace(/\s/g, ''))) return 'Invalid phone number'
  } else if (type === 'wallet') {
    // Basic Solana address: 32–44 base58 chars
    const base58Re = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    if (!base58Re.test(trimmed)) return 'Invalid Solana wallet address'
  }

  return null
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

  // 2. Parse + validate body
  let body: CreateGiftBody
  try {
    body = (await req.json()) as CreateGiftBody
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Request body must be valid JSON')
  }

  const { amountGrams, templateType, message, recipientType, recipientIdentifier } = body

  if (!amountGrams || amountGrams < MIN_GOLD_GRAMS) {
    return errorResponse('VALIDATION_ERROR', `Minimum gift amount is ${MIN_GOLD_GRAMS}g`)
  }

  const VALID_TEMPLATES: TemplateType[] = ['tet', 'sinhnhat', 'cuoihoi', 'thoinhoi']
  if (!VALID_TEMPLATES.includes(templateType)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid template type')
  }

  const VALID_RECIPIENT_TYPES: RecipientType[] = ['email', 'phone', 'wallet']
  if (!VALID_RECIPIENT_TYPES.includes(recipientType)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid recipient type')
  }

  const recipientError = validateRecipient(recipientType, recipientIdentifier)
  if (recipientError) {
    return errorResponse('VALIDATION_ERROR', recipientError)
  }

  // 3. Check sender has enough gold
  const { data: profile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('gold_balance')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return errorResponse('DATABASE_ERROR', 'Failed to load user profile')
  }

  if ((profile.gold_balance ?? 0) < amountGrams) {
    return errorResponse('VALIDATION_ERROR', 'Insufficient gold balance')
  }

  // 4. Debit gold from sender wallet (escrow)
  const newBalance = profile.gold_balance - amountGrams
  const { error: debitError } = await adminClient
    .from('user_profiles')
    .update({ gold_balance: newBalance })
    .eq('id', userId)

  if (debitError) {
    return errorResponse('DATABASE_ERROR', `Failed to debit gold: ${debitError.message}`)
  }

  // 5. Create gift record
  const claimCode = generateClaimCode()
  const expiresAt = new Date(Date.now() + GIFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: gift, error: giftError } = await adminClient
    .from('gifts')
    .insert({
      from_user_id: userId,
      to_piggy_id: null, // Recipient chooses their piggy at claim time
      amount: amountGrams,
      message: message?.trim() || null,
      template_type: templateType,
      claim_code: claimCode,
      status: 'pending',
      recipient_identifier: recipientIdentifier.trim(),
      recipient_type: recipientType,
      expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (giftError || !gift) {
    // Rollback: refund gold on gift insert failure
    await adminClient
      .from('user_profiles')
      .update({ gold_balance: profile.gold_balance })
      .eq('id', userId)
    return errorResponse('DATABASE_ERROR', `Failed to create gift: ${giftError?.message}`)
  }

  // 6. Log transaction
  await adminClient.from('transactions').insert({
    user_id: userId,
    type: 'gift_sent',
    amount: amountGrams,
    status: 'pending', // Will be 'completed' when recipient claims
    metadata: {
      giftId: gift.id,
      claimCode,
      recipientType,
      recipientIdentifier: recipientIdentifier.trim(),
    },
  })

  // 7. Respond with claim link
  const shareUrl = `https://heodat.app/gift/${claimCode}`

  return jsonResponse({
    success: true,
    data: {
      giftId: gift.id,
      claimCode,
      shareUrl,
      expiresAt,
      amountGrams,
    },
  })
}

Deno.serve(withErrorHandler(handler))
