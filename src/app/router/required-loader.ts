import type { QueryClient, QueryExecuteOptions, QueryKey } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { ApiError } from '@/api/error'
import { publishIncident } from '@/api/http/incident'

/** What a record-level not-found carries to the not-found page, so it can say "record" rather than "page". */
export interface RequiredNotFoundData {
  readonly kind: 'record'
}

export function isRequiredNotFoundData(data: unknown): data is RequiredNotFoundData {
  return typeof data === 'object' && data !== null && (data as { kind?: unknown }).kind === 'record'
}

/**
 * Detail and edit routes await their required single-record query here (2026-09-11 user decision:
 * entry failures belong to the route boundary). The same query options feed the screen's
 * `useDetailQuery`, whose `DetailStateBoundary` then covers only transitions after entry.
 *
 * - `not-found` → Router `notFound({ data: { kind: 'record' } })`: the not-found page says "record".
 * - `forbidden` → the access page belongs to `IncidentBoundary` alone. The transport already published
 *   the incident, but with no observer on the query the boundary must ignore it (that is how preload
 *   403s stay silent), so a real navigation republishes it with `origin: 'route-loader'`; the router's
 *   error component then renders nothing under the cover. A preload never publishes.
 * - anything else → rethrown to the error component.
 */
export async function loadRequired<TQueryFnData, TData, TQueryData, TQueryKey extends QueryKey>(
  queryClient: QueryClient,
  options: QueryExecuteOptions<TQueryFnData, Error, TData, TQueryData, TQueryKey>,
  { preload = false }: { readonly preload?: boolean } = {},
): Promise<TData> {
  try {
    return await queryClient.query(options)
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'not-found') {
      // `notFound()` returns a plain object, not an Error, so Router throws it (`throw: true`). Its
      // return type is not `never`: dropping `throw: true` would fall through to the rethrow below.
      notFound({ data: { kind: 'record' } satisfies RequiredNotFoundData, throw: true })
    }
    if (error instanceof ApiError && error.kind === 'forbidden' && !preload) {
      publishIncident({ type: 'forbidden', origin: 'route-loader', status: error.status, code: error.code, requestId: error.requestId, error })
    }
    throw error
  }
}
