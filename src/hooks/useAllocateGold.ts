import { useMutation, useQueryClient } from '@tanstack/react-query'
import { allocateGold } from '@/services/grailService'
import { profileKeys } from './useUserProfile'
import { piggyKeys } from './usePiggies'

interface AllocateGoldParams {
  piggyId: string
  goldAmountGrams: number
}

export function useAllocateGold() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ piggyId, goldAmountGrams }: AllocateGoldParams) =>
      allocateGold(piggyId, goldAmountGrams),
    onSuccess: (_data, variables) => {
      // Refresh parent wallet balance + target piggy balance + tx list
      queryClient.invalidateQueries({ queryKey: profileKeys.me })
      queryClient.invalidateQueries({ queryKey: piggyKeys.detail(variables.piggyId) })
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.piggyId] })
    },
  })
}
