import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query'
import { ApiError } from './error'
import { resolveErrorOutcome } from './error-outcome'

/** The three facts a required single-record query exposes; nothing else decides its outcome. */
export interface RequiredQueryFacts<T> {
  readonly data: T | undefined
  readonly isPending: boolean
  readonly error: unknown
}

export type RequiredQueryOutcome<T> =
  | { readonly kind: 'ready'; readonly data: T }
  | { readonly kind: 'pending' }
  | { readonly kind: 'not-found'; readonly error: ApiError }
  | { readonly kind: 'error'; readonly error: ApiError | undefined }
  | { readonly kind: 'delegated'; readonly outcome: 'none' | 'incident' }

/**
 * Outcome of a query whose payload the screen cannot exist without (detail, edit load).
 *
 * Priority: incident → not-found → usable data → pending → local error → settled without data.
 * Session/permission failures belong to the app incident surface, so they are delegated even when
 * cached data exists. A fresh not-found wins over cached data because the server just said the
 * record is gone. Any other failure keeps already-loaded data readable. Settled with neither data
 * nor error is abnormal and stays a recoverable error rather than inventing not-found meaning.
 */
export function resolveRequiredQueryOutcome<T>(facts: RequiredQueryFacts<T>): RequiredQueryOutcome<T> {
  const error = facts.error instanceof ApiError ? facts.error : undefined
  if (error !== undefined) {
    const placement = resolveErrorOutcome('feature', error.kind)
    if (placement === 'incident') return { kind: 'delegated', outcome: 'incident' }
    if (error.kind === 'not-found') return { kind: 'not-found', error }
    if (placement === 'none') {
      return facts.data === undefined ? { kind: 'delegated', outcome: 'none' } : { kind: 'ready', data: facts.data }
    }
  }
  if (facts.data !== undefined) return { kind: 'ready', data: facts.data }
  if (facts.isPending) return { kind: 'pending' }
  return { kind: 'error', error }
}

export type DetailState = 'ready' | 'error' | 'notFound'

/** `pending` and `delegated` render as ready-without-content: app progress and the incident boundary own them. */
export function toDetailState(outcome: RequiredQueryOutcome<unknown>): DetailState {
  if (outcome.kind === 'not-found') return 'notFound'
  if (outcome.kind === 'error') return 'error'
  return 'ready'
}

export interface DetailQueryResult<T> {
  readonly data: T | undefined
  readonly state: DetailState
  readonly error: ApiError | undefined
  readonly retry: () => Promise<unknown>
}

/**
 * Runs one required query and projects it to the facts `DetailStateBoundary` and the screen read.
 * The caller passes its own `queryOptions`; loaders keep using the same factory directly.
 */
export function useDetailQuery<TData, TQueryKey extends QueryKey = QueryKey>(
  options: UseQueryOptions<TData, Error, TData, TQueryKey>,
): DetailQueryResult<TData> {
  const query = useQuery(options)
  const outcome = resolveRequiredQueryOutcome<TData>({
    data: query.data,
    isPending: query.isPending,
    error: query.error,
  })
  return {
    data: outcome.kind === 'ready' ? outcome.data : undefined,
    state: toDetailState(outcome),
    error: outcome.kind === 'not-found' || outcome.kind === 'error' ? outcome.error : undefined,
    retry: query.refetch,
  }
}
