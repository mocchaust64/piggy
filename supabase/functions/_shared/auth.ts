import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { errorResponse } from './errors.ts'

/**
 * Extracts and verifies the caller's JWT from the Authorization header.
 * Returns the authenticated Supabase user or an error response.
 *
 * Usage in every protected Edge Function:
 * ```ts
 * const authResult = await requireAuth(req)
 * if (authResult instanceof Response) return authResult
 * const { user, adminClient } = authResult
 * ```
 */
export type AdminClient = SupabaseClient

export async function requireAuth(req: Request): Promise<
  | Response
  | {
      userId: string
      adminClient: AdminClient
    }
> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    console.error(
      '[auth] Missing or invalid Authorization header:',
      authHeader ? 'Present but invalid' : 'Missing',
    )
    return errorResponse('UNAUTHORIZED', 'Missing or invalid Authorization header')
  }

  const jwt = authHeader.replace('Bearer ', '')

  // Use the service role client (bypasses RLS) to verify the JWT
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[auth] Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return errorResponse('INTERNAL_ERROR', 'Function configuration error')
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const {
    data: { user },
    error,
  } = await adminClient.auth.getUser(jwt)

  if (error || !user) {
    const errorDetail = error?.message ?? 'User not found'
    return errorResponse('UNAUTHORIZED', `Xác thực thất bại: ${errorDetail}`)
  }

  return { userId: user.id, adminClient }
}
