import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { analytics } from '@/lib/analytics'
import type { PiggyWithBalance } from '@/types/database'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const piggyKeys = {
  all: ['piggies'] as const,
  lists: () => [...piggyKeys.all, 'list'] as const,
  detail: (id: string) => [...piggyKeys.all, 'detail', id] as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchPiggies(): Promise<PiggyWithBalance[]> {
  const { data, error } = await supabase
    .from('piggies')
    .select('*, piggy_balances(*)')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as PiggyWithBalance[]
}

async function fetchPiggy(id: string): Promise<PiggyWithBalance> {
  const { data, error } = await supabase
    .from('piggies')
    .select('*, piggy_balances(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)
  return data as PiggyWithBalance
}

async function createPiggy(input: {
  child_name: string
  avatar_url: string
  target_amount: number | null
  target_description: string | null
}): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('piggies')
    .insert({
      child_name: input.child_name,
      avatar_url: input.avatar_url,
      target_amount: input.target_amount,
      target_description: input.target_description,
      user_id: user.id,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // Seed the balance row
  await supabase.from('piggy_balances').insert({ piggy_id: data.id, gold_amount: 0 })

  analytics.piggyCreated(!!input.target_amount)
  return data.id
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePiggies() {
  return useQuery({
    queryKey: piggyKeys.lists(),
    queryFn: fetchPiggies,
  })
}

export function usePiggy(id: string) {
  return useQuery({
    queryKey: piggyKeys.detail(id),
    queryFn: () => fetchPiggy(id),
    enabled: !!id,
  })
}

export function useCreatePiggy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPiggy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: piggyKeys.lists() })
    },
  })
}
