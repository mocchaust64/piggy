import { jsonResponse } from './cors.ts'

/** Standard error codes shared across all Edge Functions */
export type AppErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'GRAIL_ERROR'
  | 'GRAIL_TIMEOUT'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR'

const ERROR_STATUS: Record<AppErrorCode, number> = {
  UNAUTHORIZED:     401,
  FORBIDDEN:        403,
  VALIDATION_ERROR: 422,
  NOT_FOUND:        404,
  CONFLICT:         409,
  RATE_LIMITED:     429,
  GRAIL_ERROR:      502,
  GRAIL_TIMEOUT:    504,
  DATABASE_ERROR:   500,
  INTERNAL_ERROR:   500,
}

/**
 * Structured error following the project API contract:
 * { success: false, error: { code, message } }
 */
export function errorResponse(
  code: AppErrorCode,
  message: string,
  detail?: string,
): Response {
  const status = ERROR_STATUS[code]
  const body = {
    success: false,
    error: {
      code,
      message,
      ...(detail ? { detail } : {}),
    },
  }
  return jsonResponse(body, status)
}

/**
 * Wraps an Edge Function handler with top-level error catching.
 * Prevents raw stack traces from leaking to clients.
 */
export function withErrorHandler(
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[EDGE_ERROR]', message, err)
      return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
    }
  }
}
