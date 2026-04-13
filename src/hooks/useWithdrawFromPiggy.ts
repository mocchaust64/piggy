import { useMutation, useQueryClient } from '@tanstack/react-query'
import { withdrawFromPiggy } from '@/services/grailService'
import { profileKeys } from './useUserProfile'
import { piggyKeys } from './usePiggies'

interface WithdrawFromPiggyParams {
  piggyId: string
  goldAmountGrams: number
}

export function useWithdrawFromPiggy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ piggyId, goldAmountGrams }: WithdrawFromPiggyParams) =>
      withdrawFromPiggy(piggyId, goldAmountGrams),
    onSuccess: (_, { piggyId }) => {
      // Invalidate both the piggy specific data and the overall profile balance
      queryClient.invalidateQueries({ queryKey: profileKeys.me })
      queryClient.invalidateQueries({ queryKey: piggyKeys.detail(piggyId) })
      queryClient.invalidateQueries({ queryKey: piggyKeys.all })
    },
  })
}
