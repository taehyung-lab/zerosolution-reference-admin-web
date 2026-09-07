import { describe, expect, it } from 'vitest'
import { parseEnv } from '@/env'

describe('환경변수 계약', () => {
  it('기본값으로 채운다 (baseURL은 same-origin 빈 문자열)', () => {
    const env = parseEnv({})
    expect(env.VITE_API_BASE_URL).toBe('')
    expect(env.VITE_API_TIMEOUT_MS).toBe(10_000)
  })

  it('명시된 값을 사용한다', () => {
    const env = parseEnv({
      VITE_API_BASE_URL: 'https://dev.api.example.com',
      VITE_API_TIMEOUT_MS: '5000',
    })
    expect(env.VITE_API_BASE_URL).toBe('https://dev.api.example.com')
    expect(env.VITE_API_TIMEOUT_MS).toBe(5000)
  })

  it('baseURL에 /api를 넣으면 실패한다 (생성 endpoint가 이미 /api/v1을 포함)', () => {
    expect(() => parseEnv({ VITE_API_BASE_URL: 'https://x.example.com/api' })).toThrow(
      /환경변수 검증 실패/,
    )
    expect(() => parseEnv({ VITE_API_BASE_URL: '/api' })).toThrow(/환경변수 검증 실패/)
  })

  it('잘못된 값은 조용히 넘어가지 않고 실패한다', () => {
    expect(() => parseEnv({ VITE_API_TIMEOUT_MS: 'not-a-number' })).toThrow(/환경변수 검증 실패/)
    expect(() => parseEnv({ VITE_API_TIMEOUT_MS: '-1' })).toThrow(/환경변수 검증 실패/)
    expect(() => parseEnv({ VITE_APP_NAME: '' })).toThrow(/환경변수 검증 실패/)
  })
})
