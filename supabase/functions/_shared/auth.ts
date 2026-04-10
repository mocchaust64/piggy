import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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
export async function requireAuth(req: Request): Promise<
  | Response
  | {
      userId: string
      adminClient: ReturnType<typeof createClient>
    }
> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('UNAUTHORIZED', 'Missing or invalid Authorization header')
  }

  const jwt = authHeader.replace('Bearer ', '')

  // Use the service role client (bypasses RLS) to verify the JWT
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: { user }, error } = await adminClient.auth.getUser(jwt)

  if (error || !user) {
    return errorResponse('UNAUTHORIZED', 'Invalid or expired token')
  }

  return { userId: user.id, adminClient }
}
