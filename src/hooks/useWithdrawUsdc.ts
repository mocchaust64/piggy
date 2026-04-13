import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileKeys } from './useUserProfile'

interface WithdrawUsdcParams {
  amount: number
  destinationAddress: string
}

export function useWithdrawUsdc() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ amount }: WithdrawUsdcParams) => {
      // Mocking the withdrawal logic for MVP
      // In production, this would call a Supabase Edge Function to
      // handle the on-chain transfer and reduce the DB balance.
      console.log(`Mock: Withdrawing ${amount} USDC...`)
      return new Promise((resolve) => setTimeout(resolve, 1500))
    },
    onSuccess: () => {
      // Refresh the profile to show the reduced USDC balance
      queryClient.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}
