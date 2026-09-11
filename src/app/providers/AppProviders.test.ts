import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/error'
import { createQueryClient, retryOnce } from './AppProviders'

describe('createQueryClient retry policy', () => {
  it('does not retry a deterministic failure such as not-found or forbidden', async () => {
    const queryClient = createQueryClient()
    const queryFn = vi.fn(() => Promise.reject(new ApiError({ kind: 'not-found', message: 'raw', status: 404 })))
    await expect(queryClient.query({ queryKey: ['missing'], queryFn })).rejects.toBeInstanceOf(ApiError)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(retryOnce(0, new ApiError({ kind: 'forbidden', message: 'raw', status: 403 }))).toBe(false)
  })

  it('retries a transient failure once', () => {
    expect(retryOnce(0, new ApiError({ kind: 'network', message: 'raw' }))).toBe(true)
    expect(retryOnce(1, new ApiError({ kind: 'network', message: 'raw' }))).toBe(false)
    expect(retryOnce(0, new Error('boom'))).toBe(true)
  })
})
