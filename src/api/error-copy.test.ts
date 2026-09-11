import { describe, expect, it } from 'vitest'
import { safeErrorKey } from './error-copy'

describe('safeErrorKey', () => {
  it('maps every kind to its shared copy key and an unknown kind to the server-error sentence', () => {
    expect(safeErrorKey('not-found')).toBe('error.kind.notFound')
    expect(safeErrorKey('rate-limited')).toBe('error.kind.rateLimited')
    expect(safeErrorKey('network')).toBe('error.kind.network')
    expect(safeErrorKey(undefined)).toBe('error.kind.serverError')
  })
})
