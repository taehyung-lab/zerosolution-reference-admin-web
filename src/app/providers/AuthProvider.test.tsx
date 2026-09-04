import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { client } from '@/api/http/client'
import {
  clearAccessToken,
  readAccessToken,
  readLoginId,
  readReissuedAccessToken,
} from '@/api/http/credential'
import { AuthProvider, useAuth } from './AuthProvider'
import { AppProviders, createQueryClient } from './AppProviders'

function SessionStarter() {
  const { startSession } = useAuth()
  return (
    <button
      type="button"
      onClick={() => { startSession({ accessToken: 'token-from-app', loginId: 'manager_id' }) }}
    >
      set token
    </button>
  )
}

afterEach(() => { clearAccessToken() })

describe('AuthProvider', () => {
  it('registers the credential port before the login route module is loaded', async () => {
    let authorization: string | null = null
    render(<AuthProvider><SessionStarter /></AuthProvider>)
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
    render(<AppProviders queryClient={createQueryClient()}><SessionStarter /></AppProviders>)
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

  it('stores the login id alongside the token so a later reissue can be requested', () => {
    render(<AuthProvider><SessionStarter /></AuthProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'set token' }))

    expect(readAccessToken()).toBe('token-from-app')
    expect(readLoginId()).toBe('manager_id')
  })

  it('registers a reissue reader that reads the access token out of the response envelope', () => {
    expect(
      readReissuedAccessToken({
        header: { resultCode: 200, resultMessage: 'SUCCESS' },
        data: { id: 'manager_id', accessToken: 'reissued-token' },
      }),
    ).toBe('reissued-token')
    expect(readReissuedAccessToken({ accessToken: 'reissued-token' })).toBeUndefined()
    expect(readReissuedAccessToken(null)).toBeUndefined()
  })
})
