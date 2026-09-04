import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearAccessToken, readAccessToken, setAccessToken } from './credential'
import { subscribeIncident, type Incident } from './incident'

afterEach(() => {
  vi.unstubAllGlobals()
  clearAccessToken()
})

describe('access token storage', () => {
  it('persists the access token in localStorage', () => {
    setAccessToken('token-1')
    expect(localStorage.getItem('accessToken')).toBe('token-1')
    expect(readAccessToken()).toBe('token-1')
  })

  it('keeps an in-memory mirror when localStorage access throws', () => {
    const failingStorage = {
      getItem: vi.fn(() => { throw new Error('blocked') }),
      setItem: vi.fn(() => { throw new Error('blocked') }),
      removeItem: vi.fn(() => { throw new Error('blocked') }),
    }
    vi.stubGlobal('localStorage', failingStorage)

    setAccessToken('private-token')

    expect(readAccessToken()).toBe('private-token')
    expect(() => clearAccessToken()).not.toThrow()
    expect(readAccessToken()).toBeNull()
  })

  it('clears the in-memory mirror when another tab removes the token', () => {
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    setAccessToken('token-before-cross-tab-clear')
    localStorage.removeItem('accessToken')

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessToken',
      oldValue: 'token-before-cross-tab-clear',
      newValue: null,
    }))

    expect(readAccessToken()).toBeNull()
    expect(incidents).toEqual([expect.objectContaining({ type: 'unauthorized', source: 'cross-tab' })])
    unsubscribe()
  })
})
