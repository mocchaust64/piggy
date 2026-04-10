/**
 * Analytics — PostHog event tracking
 *
 * All events are defined here for type safety and easy auditing.
 * Install PostHog SDK and replace the stub when API key is available.
 */

// TODO: import PostHog from 'posthog-react-native'

export type GiftTemplateKey = 'tet' | 'sinhnhat' | 'cuoihoi' | 'thoinhoi'
export type ShareMethod = 'zalo' | 'copy_link' | 'qr_code' | 'other'
export type AuthMethod = 'apple' | 'email'

function track(event: string, properties?: Record<string, unknown>) {
  if (__DEV__) {
    console.log('[Analytics]', event, properties)
  }
  // TODO: posthog.capture(event, properties)
}

export const analytics = {
  // Onboarding
  onboardingCompleted: (authMethod: AuthMethod) =>
    track('onboarding_completed', { auth_method: authMethod }),

  // Piggy bank
  piggyCreated: (hasTarget: boolean) => track('piggy_created', { has_target: hasTarget }),

  // Gold purchase
  goldPurchased: (params: { usdcAmount: number; goldGrams: number; piggyId: string }) =>
    track('gold_purchased', {
      usdc_amount: params.usdcAmount,
      gold_grams: params.goldGrams,
      piggy_id: params.piggyId,
    }),

  // Gifting
  giftCreated: (templateType: GiftTemplateKey, goldAmount: number) =>
    track('gift_created', { template_type: templateType, gold_amount: goldAmount }),

  giftShared: (shareMethod: ShareMethod) => track('gift_shared', { share_method: shareMethod }),

  giftClaimed: (params: {
    templateType: GiftTemplateKey
    goldAmount: number
    timeToClaimHours: number
  }) =>
    track('gift_claimed', {
      template_type: params.templateType,
      gold_amount: params.goldAmount,
      time_to_claim_hours: params.timeToClaimHours,
    }),

  giftClaimFailed: (reason: 'expired' | 'already_claimed' | 'error') =>
    track('gift_claim_failed', { reason }),

  // Gift template selection
  giftTemplateSelected: (templateKey: GiftTemplateKey) =>
    track('gift_template_selected', { template: templateKey }),

  // USDC wallet
  usdcDepositViewed: () => track('usdc_deposit_viewed'),
}
