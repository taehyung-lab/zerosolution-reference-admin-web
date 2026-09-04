import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { client } from '@/api/http/client'
import { AuthProvider, useAuth } from './AuthProvider'
import { AppProviders, createQueryClient } from './AppProviders'

function TokenSetter() {
  const { setAccessToken } = useAuth()
  return <button type="button" onClick={() => setAccessToken('token-from-app')}>set token</button>
}

describe('AuthProvider', () => {
  it('registers the credential port before the login route module is loaded', async () => {
    let authorization: string | null = null
    render(<AuthProvider><TokenSetter /></AuthProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'set token' }))
    await waitFor(async () => {
      await client.get('/protected', {
        adapter: (config) => {
          const header = config.headers.get('Authorization')
          authorization = typeof header === 'string' ? header : null
          return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config })
        },
      })
      expect(authorization).toBe('Bearer token-from-app')
    })
  })

  it('is connected by AppProviders so protected requests are signed without loading login', async () => {
    let authorization: string | null = null
    render(<AppProviders queryClient={createQueryClient()}><TokenSetter /></AppProviders>)
    fireEvent.click(screen.getByRole('button', { name: 'set token' }))
    await waitFor(async () => {
      await client.get('/protected', {
        adapter: (config) => {
          const header = config.headers.get('Authorization')
          authorization = typeof header === 'string' ? header : null
          return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config })
        },
      })
      expect(authorization).toBe('Bearer token-from-app')
    })
  })
})
