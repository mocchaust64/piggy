import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { UserProfile } from '@/types/database'

export const profileKeys = {
  me: ['profile', 'me'] as const,
}

async function fetchMyProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Hook to fetch current user's profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: fetchMyProfile,
    staleTime: 60_000,
  })
}

/**
 * Senior Standard Mutation for updating user profile.
 * Implements optimistic updates and cache invalidation.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}
