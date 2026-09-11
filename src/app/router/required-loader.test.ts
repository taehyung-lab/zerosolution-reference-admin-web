import { QueryClient } from '@tanstack/react-query'
import { isNotFound } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/error'
import { isRequiredNotFoundData, loadRequired } from './required-loader'

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

describe('loadRequired', () => {
  it('returns the record and leaves it in the cache the screen reads from', async () => {
    const queryClient = client()
    const options = { queryKey: ['record', '1'] as const, queryFn: () => Promise.resolve({ id: '1' }) }
    await expect(loadRequired(queryClient, options)).resolves.toEqual({ id: '1' })
    expect(queryClient.getQueryData(options.queryKey)).toEqual({ id: '1' })
  })

  it('turns a not-found ApiError into a Router not-found carrying the record kind', async () => {
    const error = new ApiError({ kind: 'not-found', message: 'raw', status: 404 })
    const thrown = await loadRequired(client(), { queryKey: ['record', 'missing'], queryFn: () => Promise.reject(error) }).catch((value: unknown) => value)
    expect(isNotFound(thrown)).toBe(true)
    expect(isRequiredNotFoundData((thrown as { data?: unknown }).data)).toBe(true)
    expect(isRequiredNotFoundData(undefined)).toBe(false)
  })

  it('rethrows every other failure for the root error component', async () => {
    const forbidden = new ApiError({ kind: 'forbidden', message: 'raw', status: 403 })
    await expect(loadRequired(client(), { queryKey: ['record', 'denied'], queryFn: () => Promise.reject(forbidden) })).rejects.toBe(forbidden)
    const plain = new Error('boom')
    await expect(loadRequired(client(), { queryKey: ['record', 'broken'], queryFn: () => Promise.reject(plain) })).rejects.toBe(plain)
  })
})
