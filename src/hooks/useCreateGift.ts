/**
 * useCreateGift — Mutation hook for creating a new gift.
 * Calls the create-gift Edge Function and invalidates wallet balance.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { profileKeys } from './useUserProfile'

export type RecipientType = 'email' | 'phone' | 'wallet'
export type GiftTemplateType = 'tet' | 'sinhnhat' | 'cuoihoi' | 'thoinhoi'

export interface CreateGiftInput {
  amountGrams: number
  templateType: GiftTemplateType
  message: string
  recipientType: RecipientType
  recipientIdentifier: string
}

export interface CreateGiftResult {
  giftId: string
  claimCode: string
  shareUrl: string
  expiresAt: string
  amountGrams: number
}

async function createGift(input: CreateGiftInput): Promise<CreateGiftResult> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    data: CreateGiftResult
  }>('create-gift', { body: input })

  if (error) {
    const msg = (error as { context?: { message?: string } })?.context?.message || error.message
    throw new Error(msg || 'Failed to create gift')
  }

  if (!data?.success || !data.data) {
    throw new Error('Gift creation failed')
  }

  return data.data
}

/** Mutation hook for creating a gift. Invalidates wallet balance on success. */
export function useCreateGift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateGiftInput) => createGift(input),
    onSuccess: () => {
      // Refresh gold balance (debited on gift send)
      queryClient.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}
