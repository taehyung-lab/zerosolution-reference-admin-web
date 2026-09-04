import { describe, expect, it } from 'vitest'
import { formatCount } from './format'

describe('formatCount', () => {
  it.each([
    ['ko', '12,345'],
    ['en', '12,345'],
    ['ja', '12,345'],
  ])('groups digits for %s without adding a unit or sentence', (locale, expected) => {
    expect(formatCount(locale, 12345)).toBe(expected)
  })

  it('formats zero as a plain digit', () => {
    expect(formatCount('ko', 0)).toBe('0')
  })
})
