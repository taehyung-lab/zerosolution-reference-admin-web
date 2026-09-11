import type { ApiErrorKind } from './error'

/**
 * Normalized error kind → the `shared` namespace key a screen may show. Server messages and internal
 * error text never reach the screen; an unknown or missing kind reads as a server error. Domain-free,
 * so every feature (and the root pages) maps the same way (promoted from managers/lib, 2026-09-11).
 */
export type SafeErrorKey =
  | 'error.kind.network'
  | 'error.kind.timeout'
  | 'error.kind.cancelled'
  | 'error.kind.business'
  | 'error.kind.unauthorized'
  | 'error.kind.forbidden'
  | 'error.kind.validation'
  | 'error.kind.notFound'
  | 'error.kind.conflict'
  | 'error.kind.rateLimited'
  | 'error.kind.serverError'
  | 'error.kind.contract'

const KEYS: Record<ApiErrorKind, SafeErrorKey> = {
  network: 'error.kind.network',
  timeout: 'error.kind.timeout',
  cancelled: 'error.kind.cancelled',
  business: 'error.kind.business',
  unauthorized: 'error.kind.unauthorized',
  forbidden: 'error.kind.forbidden',
  validation: 'error.kind.validation',
  'not-found': 'error.kind.notFound',
  conflict: 'error.kind.conflict',
  'rate-limited': 'error.kind.rateLimited',
  'server-error': 'error.kind.serverError',
  contract: 'error.kind.contract',
}

export function safeErrorKey(kind: ApiErrorKind | undefined): SafeErrorKey {
  return kind === undefined ? 'error.kind.serverError' : KEYS[kind]
}
