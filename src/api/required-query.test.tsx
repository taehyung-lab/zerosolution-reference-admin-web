import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { ApiError } from './error'
import { resolveRequiredQueryOutcome, toDetailState, useDetailQuery } from './required-query'

const apiError = (kind: ApiError['kind']) => new ApiError({ kind, message: 'raw' })

describe('resolveRequiredQueryOutcome', () => {
  it('delegates session and permission failures even when cached data exists', () => {
    for (const kind of ['unauthorized', 'forbidden'] as const) {
      expect(resolveRequiredQueryOutcome({ data: { id: 1 }, isPending: false, error: apiError(kind) })).toEqual({
        kind: 'delegated',
        outcome: 'incident',
      })
    }
  })

  it('prefers a fresh not-found over cached data', () => {
    const error = apiError('not-found')
    expect(resolveRequiredQueryOutcome({ data: { id: 1 }, isPending: false, error })).toEqual({ kind: 'not-found', error })
  })

  it('keeps already-loaded data readable while a background refetch fails', () => {
    expect(resolveRequiredQueryOutcome({ data: { id: 1 }, isPending: false, error: apiError('server-error') })).toEqual({
      kind: 'ready',
      data: { id: 1 },
    })
  })

  it('treats a cancelled request as ready with data or as silently delegated without it', () => {
    expect(resolveRequiredQueryOutcome({ data: { id: 1 }, isPending: false, error: apiError('cancelled') })).toEqual({
      kind: 'ready',
      data: { id: 1 },
    })
    expect(resolveRequiredQueryOutcome({ data: undefined, isPending: false, error: apiError('cancelled') })).toEqual({
      kind: 'delegated',
      outcome: 'none',
    })
  })

  it('stays pending only while data is absent and the first fetch is running', () => {
    expect(resolveRequiredQueryOutcome({ data: undefined, isPending: true, error: null })).toEqual({ kind: 'pending' })
  })

  it('reports a recoverable local error for other ApiError kinds without data', () => {
    const error = apiError('timeout')
    expect(resolveRequiredQueryOutcome({ data: undefined, isPending: false, error })).toEqual({ kind: 'error', error })
  })

  it('reports an abnormal settled state without payload as an error without ApiError', () => {
    expect(resolveRequiredQueryOutcome({ data: undefined, isPending: false, error: null })).toEqual({
      kind: 'error',
      error: undefined,
    })
    expect(resolveRequiredQueryOutcome({ data: undefined, isPending: false, error: new TypeError('boom') })).toEqual({
      kind: 'error',
      error: undefined,
    })
  })

  it('projects pending and delegated to ready-without-content for the boundary', () => {
    expect(toDetailState({ kind: 'pending' })).toBe('ready')
    expect(toDetailState({ kind: 'delegated', outcome: 'incident' })).toBe('ready')
    expect(toDetailState({ kind: 'not-found', error: apiError('not-found') })).toBe('notFound')
    expect(toDetailState({ kind: 'error', error: undefined })).toBe('error')
  })
})

describe('useDetailQuery', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )

  it('exposes data, state, error, and retry from one queryOptions definition', async () => {
    const { result } = renderHook(
      () => useDetailQuery(queryOptions({ queryKey: ['detail', 'ok'], queryFn: () => Promise.resolve({ id: 'a' }) })),
      { wrapper },
    )
    expect(result.current.state).toBe('ready')
    expect(result.current.data).toBeUndefined()
    await waitFor(() => expect(result.current.data).toEqual({ id: 'a' }))
    expect(result.current.error).toBeUndefined()
  })

  it('maps a not-found ApiError to the notFound state with the error attached', async () => {
    const { result } = renderHook(
      () =>
        useDetailQuery(
          queryOptions({
            queryKey: ['detail', 'missing'],
            queryFn: (): Promise<{ id: string }> => Promise.reject(apiError('not-found')),
          }),
        ),
      { wrapper },
    )
    await waitFor(() => expect(result.current.state).toBe('notFound'))
    expect(result.current.error?.kind).toBe('not-found')
    expect(result.current.data).toBeUndefined()
  })
})
