/**
 * Which progress surface a query's first fetch is allowed to open.
 *
 * The app-wide `BlockingProgress` covers only a primary request required for screen entry.
 * Mounted content transitions stay on their content surface, while option and lookup data stay
 * inside their field. Route loaders warm option caches on entry or preload intent.
 */
import type { QueryKey } from '@tanstack/react-query'

export type QueryProgress = 'blocking' | 'content' | 'inline'

export interface ApiQueryMeta extends Record<string, unknown> {
  readonly progress?: QueryProgress
}

/**
 * A mutation declares which cache families its success makes stale. The app's `MutationCache`
 * invalidates them, so a screen never wires `onSuccess` by hand and a forgotten invalidation
 * cannot leave a list showing a record the user just changed.
 */
export interface ApiMutationMeta extends Record<string, unknown> {
  readonly invalidates?: readonly QueryKey[]
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: ApiQueryMeta
    mutationMeta: ApiMutationMeta
  }
}

/** Spread into option/lookup `queryOptions` so the shell keeps its blocking overlay closed. */
export const inlineProgress = { meta: { progress: 'inline' } } as const satisfies { meta: ApiQueryMeta }

/** Spread into a screen-entry primary query that must finish before the screen is usable. */
export const blockingProgress = { meta: { progress: 'blocking' } } as const satisfies { meta: ApiQueryMeta }

/** Spread into search/sort/filter/page or another mounted-content request without covering it. */
export const contentProgress = { meta: { progress: 'content' } } as const satisfies { meta: ApiQueryMeta }
