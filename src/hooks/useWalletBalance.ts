import { useUserProfile } from './useUserProfile'

/**
 * Derives wallet balances from the cached user profile.
 * No extra network call — reuses the TanStack Query cache from useUserProfile.
 */
export function useWalletBalance() {
  const { data: profile, isLoading, isError, refetch } = useUserProfile()

  return {
    goldBalance: profile?.gold_balance ?? 0,
    usdcBalance: profile?.grail_usdc_balance ?? 0,
    depositAddress: profile?.grail_deposit_address ?? null,
    isLoading,
    isError,
    refetch,
  }
}
