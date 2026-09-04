import { ApiError, type ApiErrorKind } from '@/api/error'

export type ErrorOperationContext =
  | 'feature'
  | 'prefetch'
  | 'render'
  | 'route-loader'
  | 'fatal'
  | 'route-not-found'

export type ErrorOutcome = 'none' | 'feature' | 'incident' | 'root'

function observedFeatureOutcome(kind: ApiErrorKind): ErrorOutcome {
  if (kind === 'cancelled') return 'none'
  if (kind === 'unauthorized' || kind === 'forbidden') return 'incident'
  return 'feature'
}

export function isFeatureError(error: unknown): error is ApiError {
  return error instanceof ApiError && resolveErrorOutcome('feature', error.kind) === 'feature'
}

/** UI placement is decided from the operation that failed, never from kind alone. */
export function resolveErrorOutcome(
  context: ErrorOperationContext,
  kind: ApiErrorKind,
): ErrorOutcome {
  if (context === 'route-not-found' || context === 'render' || context === 'route-loader' || context === 'fatal') {
    return 'root'
  }
  if (context === 'prefetch' && kind === 'forbidden') return 'none'
  return observedFeatureOutcome(kind)
}
