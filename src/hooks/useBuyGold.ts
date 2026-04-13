import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buyGold } from '@/services/grailService'
import { profileKeys } from './useUserProfile'

interface BuyGoldParams {
  goldAmountGrams: number
  maxUsdcAmount: number
}

export function useBuyGold() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ goldAmountGrams, maxUsdcAmount }: BuyGoldParams) =>
      buyGold(goldAmountGrams, maxUsdcAmount),
    onSuccess: () => {
      // Invalidate user profile so wallet gold_balance refreshes
      queryClient.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}
