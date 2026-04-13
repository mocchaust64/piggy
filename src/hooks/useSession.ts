import { useEffect, useRef, useState } from 'react'
import { useRouter, useSegments } from 'expo-router'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { getBalance } from '@/services/grailService'

interface UseSessionReturn {
  session: Session | null
  user: User | null
  /** True while the initial session is being fetched from SecureStore */
  isLoading: boolean
}

/**
 * Hook that subscribes to Supabase auth state and handles navigation guards.
 *
 * Place this hook in the root layout only.
 * - Unauthenticated users are redirected to `/(auth)/login`.
 * - Authenticated users accessing `/(auth)/*` are redirected to `/(tabs)`.
 *
 * @returns session, user, isLoading
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()
  // Track which user IDs we've already provisioned to avoid repeated calls
  const provisionedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // 1. Read the persisted session from SecureStore on app launch
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)

      setIsLoading(false)
    })

    // 2. Subscribe to future auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      setSession(updatedSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 3. Provision GRAIL wallet on first login (lazy — only once per session)
  useEffect(() => {
    if (!session?.user?.id || !session.access_token) return
    if (provisionedRef.current.has(session.user.id)) return
    provisionedRef.current.add(session.user.id)

    // Explicitly set the session on the Supabase client before invoking —
    // the React state update and the client's internal token may not be in sync yet.
    supabase.auth
      .setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
      .then(() => {
        // Fire-and-forget: creates GRAIL wallet + saves deposit address if not yet done.
        return getBalance()
      })
      .catch((err) =>
        console.warn(
          '[useSession] GRAIL provisioning failed (will retry on Wallet screen):',
          err?.message,
        ),
      )
  }, [session?.user?.id, session?.access_token, session?.refresh_token])

  // 3. Navigation guard — runs after loading is complete
  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      // Not logged in → push to login (safety: only if not already there)
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      // Logged in but still on auth screens → push to home
      router.replace('/(tabs)')
    }
  }, [session, isLoading, segments, router])

  return {
    session,
    user: session?.user ?? null,
    isLoading,
  }
}
