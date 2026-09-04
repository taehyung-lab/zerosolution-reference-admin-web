import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearAccessToken,
  readAccessToken,
  readLoginId,
  setAccessToken,
  setLoginId,
} from './credential'
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

  it('keeps the login id for the lifetime of the access token', () => {
    setAccessToken('token-1')
    setLoginId('manager_id')

    expect(localStorage.getItem('loginId')).toBe('manager_id')
    expect(readLoginId()).toBe('manager_id')

    clearAccessToken()

    expect(readLoginId()).toBeNull()
    expect(localStorage.getItem('loginId')).toBeNull()
  })

  it('keeps an in-memory login id mirror when localStorage access throws', () => {
    const failingStorage = {
      getItem: vi.fn(() => { throw new Error('blocked') }),
      setItem: vi.fn(() => { throw new Error('blocked') }),
      removeItem: vi.fn(() => { throw new Error('blocked') }),
    }
    vi.stubGlobal('localStorage', failingStorage)

    setLoginId('manager_id')

    expect(readLoginId()).toBe('manager_id')
    expect(() => clearAccessToken()).not.toThrow()
    expect(readLoginId()).toBeNull()
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
