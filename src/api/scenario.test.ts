import { afterEach, describe, expect, it, vi } from 'vitest'
import { scenarioRequest } from './scenario'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('scenarioRequest', () => {
  it('logs the business label once with the waiting notice and resolves so the success path runs', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const run = scenarioRequest<{ readonly id: string; readonly password: string }>('예시 업무')

    await expect(run({ id: 'record-1', password: 'secret-value' })).resolves.toBeUndefined()

    expect(log).toHaveBeenCalledExactlyOnceWith('[시나리오] 예시 업무: 요청 입력 확인 → API 연결 대기')
  })

  it('never writes the input into the log', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await scenarioRequest<{ readonly password: string }>('예시 업무')({ password: 'secret-value' })

    expect(log.mock.calls.join('\n')).not.toContain('secret-value')
  })
})
