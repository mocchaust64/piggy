import { useQuery } from '@tanstack/react-query'
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

export function useUserProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: fetchMyProfile,
    staleTime: 60_000,
  })
}
