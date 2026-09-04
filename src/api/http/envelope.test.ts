import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../error'
import { unwrapEnvelope } from './envelope'

function captureApiError(run: () => unknown): ApiError {
  try {
    run()
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError)
    if (error instanceof ApiError) return error
  }
  throw new Error('ApiError가 발생해야 한다')
}

describe('응답 봉투 판정', () => {
  it('HTTP 200 + resultCode 200 봉투에서 data를 꺼낸다', () => {
    const value = unwrapEnvelope<{ id: number }>({
      header: { resultCode: 200, resultMessage: 'SUCCESS' },
      data: { id: 7 },
    })
    expect(value).toEqual({ id: 7 })
  })

  /** ADR 0001 "HTTP 200 응답의 resultCode 매핑" 이 선언한 code 는 확인된 판정이므로 경고하지 않는다. */
  it.each([
    [400, 'validation'],
    [401, 'unauthorized'],
    [4004, 'unauthorized'],
  ] as const)('HTTP 200 + 선언된 resultCode %s를 %s로 판정한다', (resultCode, kind) => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const error = captureApiError(() =>
      unwrapEnvelope(
        { header: { resultCode, resultMessage: '서버 원문' }, data: null },
        'req-1',
      ),
    )

    expect(error).toMatchObject({ kind, code: String(resultCode), status: 200, requestId: 'req-1' })
    expect(error.message).not.toContain('서버 원문')
    expect(log).not.toHaveBeenCalled()
    log.mockRestore()
  })

  it('미확인 resultCode 2100은 회복 의미를 주장하지 않는 business로 분류한다', () => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const error = captureApiError(() =>
      unwrapEnvelope({ header: { resultCode: 2100, resultMessage: 'NOT EXIST' }, data: null }),
    )

    expect(error).toMatchObject({ kind: 'business', code: '2100', status: 200 })
    expect(error.kind).not.toBe('conflict')
    expect(log).toHaveBeenCalledWith(
      'Unmapped API business code',
      expect.objectContaining({ resultCode: 2100 }),
    )
    expect(JSON.stringify(log.mock.calls)).not.toContain('NOT EXIST')
    log.mockRestore()
  })

  it('header가 없는 HTTP 200 payload는 contract 오류로 분류한다', () => {
    const error = captureApiError(() => unwrapEnvelope({ data: { id: 7 } }, 'req-2'))
    expect(error).toMatchObject({ kind: 'contract', status: 200, requestId: 'req-2' })
  })
})
