import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Transaction } from '@/types/database'

export const txKeys = {
  all: ['transactions'] as const,
  list: (piggyId?: string) => [...txKeys.all, 'list', piggyId ?? 'all'] as const,
}

async function fetchTransactions(piggyId?: string): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (piggyId) {
    query = query.eq('piggy_id', piggyId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export function useTransactions(piggyId?: string) {
  return useQuery({
    queryKey: txKeys.list(piggyId),
    queryFn: () => fetchTransactions(piggyId),
  })
}
