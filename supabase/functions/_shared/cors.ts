/**
 * CORS headers for Supabase Edge Functions.
 * All functions must include these to support Expo/React Native clients.
 */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
} as const

/**
 * Returns a proper HTTP 204 response for OPTIONS preflight requests.
 * Call this at the top of every Edge Function handler.
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  return null
}

/**
 * Creates a JSON response with CORS headers attached.
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
