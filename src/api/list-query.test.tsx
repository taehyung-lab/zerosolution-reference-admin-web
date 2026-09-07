import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from './error'
import { useListQuery } from './list-query'

type Response = { readonly list: readonly string[]; readonly totalCount: number }

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const select = (data: Response) => ({ rows: data.list, total: data.totalCount })

const listOptions = (key: string, fetch: () => Promise<Response>) =>
  queryOptions({ queryKey: ['list', key] as const, queryFn: fetch })

describe('useListQuery', () => {
  it('treats an empty page as a settled result, not an error', async () => {
    const { result } = renderHook(
      () =>
        useListQuery({
          options: listOptions('empty', () => Promise.resolve({ list: [], totalCount: 0 })),
          searched: true,
          select,
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current).toMatchObject({ rows: [], total: 0, isError: false, trace: undefined })
  })

  it('leaves a failure the incident surface owns out of the list error', async () => {
    const forbidden = () =>
      Promise.reject(new ApiError({ kind: 'forbidden', message: 'no' }))
    const { result } = renderHook(
      () => useListQuery({ options: listOptions('forbidden', forbidden), searched: true, select }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isFetching).toBe(false))
    expect(result.current.isError).toBe(false)
    expect(result.current.trace).toBeUndefined()
  })

  it('keeps a failure the list owns as its own error with the trace', async () => {
    const failed = () => Promise.reject(new ApiError({ kind: 'server-error', message: 'boom' }))
    const { result } = renderHook(
      () => useListQuery({ options: listOptions('server-error', failed), searched: true, select }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.trace?.kind).toBe('server-error')
  })

  it('does not run before the caller reports a searched view', async () => {
    const fetch = vi.fn(() => Promise.resolve({ list: [], totalCount: 0 }))
    const { result } = renderHook(
      () => useListQuery({ options: listOptions('idle', fetch), searched: false, select }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isFetching).toBe(false))
    expect(fetch).not.toHaveBeenCalled()
    expect(result.current).toMatchObject({ rows: [], total: 0, searched: false })
  })

  it('marks only the fetch the screen entered on as blocking', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const fetch = () => Promise.resolve({ list: ['a'], totalCount: 1 })
    const { rerender, result } = renderHook(
      ({ key }: { key: string }) =>
        useListQuery({ options: listOptions(key, fetch), searched: true, select }),
      { wrapper, initialProps: { key: 'entry' } },
    )
    await waitFor(() => expect(result.current.rows).toEqual(['a']))
    rerender({ key: 'sorted' })
    await waitFor(() => expect(result.current.rows).toEqual(['a']))

    const progressOf = (key: string) =>
      queryClient.getQueryCache().find({ queryKey: ['list', key] })?.meta?.progress
    expect(progressOf('entry')).toBe('blocking')
    expect(progressOf('sorted')).toBe('content')
  })

  it('keeps the rows already on screen while the next committed view is still loading', async () => {
    let release!: (page: Response) => void
    const pending = () => new Promise<Response>((resolve) => { release = resolve })
    const { rerender, result } = renderHook(
      ({ key, fetch }: { key: string; fetch: () => Promise<Response> }) =>
        useListQuery({ options: listOptions(key, fetch), searched: true, select }),
      {
        wrapper: createWrapper(),
        initialProps: {
          key: 'first',
          fetch: (): Promise<Response> => Promise.resolve({ list: ['first-row'], totalCount: 1 }),
        },
      },
    )
    await waitFor(() => expect(result.current.rows).toEqual(['first-row']))

    rerender({ key: 'second', fetch: pending })
    await waitFor(() => expect(result.current.isFetching).toBe(true))
    // The committed page stays rendered instead of collapsing to the loading surface.
    expect(result.current.rows).toEqual(['first-row'])
    expect(result.current.total).toBe(1)
    expect(result.current.isPending).toBe(false)

    release({ list: ['second-row'], totalCount: 1 })
    await waitFor(() => expect(result.current.rows).toEqual(['second-row']))
    expect(result.current.isFetching).toBe(false)
  })
})
