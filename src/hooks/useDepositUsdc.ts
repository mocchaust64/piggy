import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { profileKeys } from './useUserProfile'

interface DepositResult {
  newBalance: number
  amount: number
}

async function depositUsdc(amount: number): Promise<DepositResult> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    data: { newBalance: number }
  }>('simulate-action', {
    body: { action: 'deposit', amount },
  })

  if (error) {
    const errorMsg = (error as any)?.context?.message || error.message || 'Deposit failed'
    throw new Error(errorMsg)
  }

  if (!data?.success) {
    throw new Error('Deposit failed')
  }

  return { newBalance: data.data.newBalance, amount }
}

export function useDepositUsdc() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (amount: number) => depositUsdc(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}
