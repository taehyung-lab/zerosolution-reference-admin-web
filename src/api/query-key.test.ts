import { describe, expect, it } from 'vitest'
import { localizedQueryKey } from './query-key'

describe('localizedQueryKey', () => {
  it('미확인 응답군을 보수적으로 격리하도록 UI locale을 모든 API key에 포함한다', () => {
    expect(localizedQueryKey('en', 'performances', 'list')).toEqual([
      'api',
      'en',
      'performances',
      'list',
    ])
  })
})
