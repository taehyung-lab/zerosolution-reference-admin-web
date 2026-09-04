import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosAdapter, type AxiosRequestConfig } from 'axios'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { ApiError, type ApiErrorKind } from '../error'
import { client } from './client'
import {
  clearAccessToken,
  readAccessToken,
  readCredentialGeneration,
  readLoginId,
  registerReissueTokenReader,
  setAccessToken,
  setLoginId,
} from './credential'
import { subscribeIncident, type Incident } from './incident'
import { registerLocaleGetter } from './locale'
import { customInstance } from './mutator'

type TestEnvelope<T> = { header?: unknown; data?: T }

function signIn(data: { id: string; password: string }) {
  return customInstance<TestEnvelope<{ accessToken: string }>>({
    url: '/api/v1/auth/sign-in',
    method: 'POST',
    data,
  })
}

function ping(options?: AxiosRequestConfig) {
  return customInstance<TestEnvelope<unknown>>(
    { url: '/api/v1/auth/ping', method: 'POST' },
    options,
  )
}

const ORIGIN = 'http://localhost:3000'
const SIGN_IN = `${ORIGIN}/api/v1/auth/sign-in`
const REISSUE = `${ORIGIN}/api/v1/auth/reissue`
const TWO_FA = `${ORIGIN}/api/v1/auth/2fa/email/send`
const PING = `${ORIGIN}/api/v1/auth/ping`
const EXCEL = `${ORIGIN}/api/v1/test/excel-download`

/**
 * 실계약의 reissue 응답은 봉투다(`rs.Ah.AuthDTO$SignInResponse`).
 * app 경계가 등록하는 reader와 같은 자리를 읽어 테스트가 틀린 모양을 고정하지 않게 한다.
 */
function readEnvelopeAccessToken(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null || !('data' in payload)) return undefined
  const data: unknown = payload.data
  if (typeof data !== 'object' || data === null || !('accessToken' in data)) return undefined
  return typeof data.accessToken === 'string' ? data.accessToken : undefined
}

function successful(data: unknown = null, headers?: HeadersInit) {
  return HttpResponse.json(
    { header: { resultCode: 200, resultMessage: 'SUCCESS' }, data },
    { headers },
  )
}

async function expectApiError(request: Promise<unknown>, kind: ApiErrorKind) {
  try {
    await request
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError)
    if (error instanceof ApiError) {
      expect(error.kind).toBe(kind)
      return error
    }
  }
  throw new Error(`ApiError(${kind})가 발생해야 한다`)
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  clearAccessToken()
  registerReissueTokenReader(() => undefined)
  registerLocaleGetter(() => 'ko')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
afterAll(() => server.close())

describe('transport 통합 (mutator -> 봉투 -> 헤더)', () => {
  it('mutator가 정확한 경로를 호출하고 성공 봉투를 벗긴다', async () => {
    let requestedUrl = ''
    server.use(
      http.post(SIGN_IN, ({ request }) => {
        requestedUrl = request.url
        return successful({ accessToken: 'tok-1' })
      }),
    )

    const result = await signIn({ id: 'tester', password: 'pw' })

    expect(result.accessToken).toBe('tok-1')
    expect(requestedUrl).toBe(SIGN_IN)
    expect(requestedUrl).not.toContain('/api/api')
  })

  it('HTTP 400은 validation으로 분류하고 fieldErrors를 정규화한다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    server.use(
      http.post(SIGN_IN, () =>
        HttpResponse.json(
          {
            header: { resultCode: 400, resultMessage: '입력값이 올바르지 않습니다.' },
            data: [
              { field: 'password', validCode: 'NotBlank', message: '공백일 수 없습니다' },
              { field: 'id', validCode: 'NotBlank', message: '공백일 수 없습니다' },
            ],
          },
          { status: 400 },
        ),
      ),
    )

    const error = await expectApiError(signIn({ id: '', password: '' }), 'validation')

    expect(error).toMatchObject({ status: 400, code: '400' })
    expect(error.fieldErrors).toEqual([
      { field: 'password', code: 'NotBlank' },
      { field: 'id', code: 'NotBlank' },
    ])
    expect(error.message).not.toContain('입력값이 올바르지 않습니다.')
  })

  it.each([
    [400, 'validation'],
    [401, 'unauthorized'],
    [4004, 'unauthorized'],
  ] as const)('HTTP 200 + 선언된 resultCode %s를 %s로 판정한다', async (resultCode, kind) => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    server.use(
      http.post(PING, () =>
        HttpResponse.json(
          { header: { resultCode, resultMessage: '서버 원문' }, data: null },
          { headers: { 'x-request-id': 'req-declared' } },
        ),
      ),
    )

    const error = await expectApiError(ping(), kind)

    expect(error).toMatchObject({ status: 200, code: String(resultCode), requestId: 'req-declared' })
    expect(error.message).not.toContain('서버 원문')
    expect(log).not.toHaveBeenCalled()
  })

  it('HTTP 200의 미확인 업무 code를 business로 분류하고 code를 보존한다', async () => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    server.use(
      http.post(PING, () =>
        HttpResponse.json({
          header: { resultCode: 2100, resultMessage: 'NOT EXIST' },
          data: null,
        }),
      ),
    )

    const error = await expectApiError(ping(), 'business')

    expect(error.code).toBe('2100')
    expect(error.kind).not.toBe('conflict')
    expect(log).toHaveBeenCalledWith(
      'Unmapped API business code',
      expect.objectContaining({ resultCode: 2100 }),
    )
  })

  it('does not write raw resultMessage to developer output', async () => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    server.use(
      http.post(PING, () => HttpResponse.json({
        header: { resultCode: 2100, resultMessage: 'private-server-message' },
        data: null,
      })),
    )

    await expectApiError(ping(), 'business')

    expect(JSON.stringify(log.mock.calls)).not.toContain('private-server-message')
  })

  it.each([
    [403, 'forbidden'],
    [404, 'not-found'],
    [409, 'conflict'],
    [429, 'rate-limited'],
    [500, 'server-error'],
    [503, 'server-error'],
  ] as const)('HTTP %s를 %s로 분류한다', async (status, kind) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    server.use(
      http.post(PING, () =>
        HttpResponse.json(
          { header: { resultCode: status, resultMessage: '서버 원문' }, data: null },
          { status, headers: { 'x-request-id': 'req-http' } },
        ),
      ),
    )

    const error = await expectApiError(ping(), kind)

    expect(error).toMatchObject({ status, code: String(status), requestId: 'req-http' })
    expect(error.message).not.toContain('서버 원문')
  })

  it('응답이 없는 axios 실패는 network로 분류한다', async () => {
    server.use(http.post(PING, () => HttpResponse.error()))
    await expectApiError(ping(), 'network')
  })

  it.each(['ECONNABORTED', 'ETIMEDOUT'])('%s는 timeout으로 분류한다', async (code) => {
    const timeoutAdapter: AxiosAdapter = (config) =>
      Promise.reject(new AxiosError('timeout', code, config))
    await expectApiError(ping({ adapter: timeoutAdapter }), 'timeout')
  })

  it('axios cancel은 cancelled로 분류한다', async () => {
    const controller = new AbortController()
    controller.abort()
    await expectApiError(ping({ signal: controller.signal }), 'cancelled')
  })

  it('JSON 응답인데 봉투 header가 없으면 contract로 분류한다', async () => {
    server.use(http.post(PING, () => HttpResponse.json({ data: null })))
    await expectApiError(ping(), 'contract')
  })

  it('비-JSON 엑셀 응답은 봉투를 판정하지 않고 payload를 그대로 반환한다', async () => {
    server.use(
      http.get(
        EXCEL,
        () =>
          new HttpResponse('xlsx-binary', {
            headers: {
              'content-type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          }),
      ),
    )

    const result = await customInstance<string>({
      url: '/api/v1/test/excel-download',
      method: 'GET',
      responseType: 'text',
    })

    expect(result).toBe('xlsx-binary')
  })

  it('인증 요청에만 Authorization을 붙이고 sign-in/reissue/2fa에는 생략한다', async () => {
    setAccessToken('tok-1')
    const seen = new Map<string, string | null>()
    const handler = ({ request }: { request: Request }) => {
      seen.set(new URL(request.url).pathname, request.headers.get('authorization'))
      return successful({})
    }
    server.use(
      http.post(PING, handler),
      http.post(SIGN_IN, handler),
      http.post(REISSUE, handler),
      http.post(TWO_FA, handler),
    )

    await ping()
    await client.post('/api/v1/auth/sign-in', {})
    await client.post('/api/v1/auth/reissue', {})
    await client.post('/api/v1/auth/2fa/email/send', {})

    expect(seen).toEqual(
      new Map([
        ['/api/v1/auth/ping', 'Bearer tok-1'],
        ['/api/v1/auth/sign-in', null],
        ['/api/v1/auth/reissue', null],
        ['/api/v1/auth/2fa/email/send', null],
      ]),
    )
  })

  it('sends refresh cookies on every request', () => {
    expect(client.defaults.withCredentials).toBe(true)
  })

  it('reissues once at the contract path with the stored login id, then retries the request once', async () => {
    setAccessToken('old-token')
    setLoginId('manager_id')
    registerReissueTokenReader(readEnvelopeAccessToken)
    const seenTokens: Array<string | null> = []
    let protectedCalls = 0
    let reissueCalls = 0
    let reissueUrl = ''
    let reissueBody: unknown = null
    server.use(
      http.post(PING, ({ request }) => {
        protectedCalls += 1
        seenTokens.push(request.headers.get('authorization'))
        return protectedCalls === 1
          ? HttpResponse.json({}, { status: 401 })
          : successful()
      }),
      http.post(REISSUE, async ({ request }) => {
        reissueCalls += 1
        reissueUrl = request.url
        reissueBody = await request.json()
        return successful({ accessToken: 'new-token' })
      }),
    )

    await ping()

    expect(reissueCalls).toBe(1)
    expect(reissueUrl).toBe(REISSUE)
    expect(reissueBody).toEqual({ id: 'manager_id' })
    expect(seenTokens).toEqual(['Bearer old-token', 'Bearer new-token'])
    expect(localStorage.getItem('accessToken')).toBe('new-token')
  })

  it('fails terminally without calling reissue when no login id is stored', async () => {
    setAccessToken('old-token')
    registerReissueTokenReader(readEnvelopeAccessToken)
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    let reissueCalls = 0
    server.use(
      http.post(PING, () => HttpResponse.json({}, { status: 401 })),
      http.post(REISSUE, () => {
        reissueCalls += 1
        return successful({ accessToken: 'new-token' })
      }),
    )

    await expectApiError(ping(), 'unauthorized')

    expect(reissueCalls).toBe(0)
    expect(readAccessToken()).toBeNull()
    expect(incidents).toEqual([
      expect.objectContaining({ type: 'unauthorized', source: 'refresh' }),
    ])
    unsubscribe()
  })

  it('deduplicates concurrent 401 reissue within the document', async () => {
    setAccessToken('old-token')
    setLoginId('manager_id')
    registerReissueTokenReader(() => 'new-token')
    let reissueCalls = 0
    server.use(
      http.post(PING, ({ request }) =>
        request.headers.get('authorization') === 'Bearer old-token'
          ? HttpResponse.json({}, { status: 401 })
          : successful(),
      ),
      http.post(REISSUE, async () => {
        reissueCalls += 1
        await new Promise((resolve) => setTimeout(resolve, 20))
        return successful({ accessToken: 'new-token' })
      }),
    )

    await Promise.all([ping(), ping(), ping()])

    expect(reissueCalls).toBe(1)
  })

  it('skips reissue after the cross-tab lock when another tab already rotated the token', async () => {
    setAccessToken('old-token')
    registerReissueTokenReader(() => 'unexpected-token')
    let reissueCalls = 0
    const request = vi.fn(async (_name: string, callback: () => Promise<string>) => {
      setAccessToken('other-tab-token')
      return callback()
    })
    vi.stubGlobal('navigator', { ...navigator, locks: { request } })
    server.use(
      http.post(PING, ({ request: apiRequest }) =>
        apiRequest.headers.get('authorization') === 'Bearer old-token'
          ? HttpResponse.json({}, { status: 401 })
          : successful(),
      ),
      http.post(REISSUE, () => {
        reissueCalls += 1
        return successful({ accessToken: 'unexpected-token' })
      }),
    )

    await ping()

    expect(request).toHaveBeenCalledOnce()
    expect(reissueCalls).toBe(0)
  })

  it('replays a retried 401 once with an already-rotated current token without a second reissue', async () => {
    setAccessToken('old-token')
    setLoginId('manager_id')
    registerReissueTokenReader(() => 'refresh-token')
    let reissueCalls = 0
    const seen: Array<string | null> = []
    server.use(
      http.post(PING, ({ request }) => {
        const token = request.headers.get('authorization')
        seen.push(token)
        if (token === 'Bearer old-token') return HttpResponse.json({}, { status: 401 })
        if (token === 'Bearer refresh-token') {
          setAccessToken('other-tab-token')
          return HttpResponse.json({}, { status: 401 })
        }
        return successful()
      }),
      http.post(REISSUE, () => {
        reissueCalls += 1
        return successful({ accessToken: 'refresh-token' })
      }),
    )

    await ping()

    expect(reissueCalls).toBe(1)
    expect(seen).toEqual(['Bearer old-token', 'Bearer refresh-token', 'Bearer other-tab-token'])
  })

  it('treats a rejected reissue as terminal, clears the dead credential, and publishes a refresh incident', async () => {
    setAccessToken('old-token')
    setLoginId('manager_id')
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    let reissueCalls = 0
    server.use(
      http.post(PING, () => HttpResponse.json({}, { status: 401 })),
      http.post(REISSUE, () => {
        reissueCalls += 1
        return HttpResponse.json({}, { status: 401 })
      }),
    )

    await expectApiError(ping(), 'unauthorized')

    expect(reissueCalls).toBe(1)
    expect(readAccessToken()).toBeNull()
    expect(readLoginId()).toBeNull()
    expect(incidents).toEqual([
      expect.objectContaining({ type: 'unauthorized', source: 'refresh', status: 401 }),
    ])
    unsubscribe()
  })

  /** 봉투가 자격증명 거부(`401`·`4004`)를 선언한 경우만 terminal 이다 (ADR 0001 resultCode 표). */
  it('treats a declared credential rejection from reissue as terminal', async () => {
    setAccessToken('old-token')
    setLoginId('manager_id')
    const generationAtSignIn = readCredentialGeneration()
    registerReissueTokenReader(readEnvelopeAccessToken)
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    server.use(
      http.post(PING, () => HttpResponse.json({}, { status: 401 })),
      http.post(REISSUE, () =>
        HttpResponse.json(
          { header: { resultCode: 4004, resultMessage: 'SESSION EXPIRED' }, data: null },
          { headers: { 'x-request-id': 'req-envelope-failure' } },
        ),
      ),
    )

    const error = await expectApiError(ping(), 'unauthorized')

    expect(error).toMatchObject({ code: '4004', requestId: 'req-envelope-failure' })
    expect(error.message).not.toContain('SESSION EXPIRED')
    expect(readAccessToken()).toBeNull()
    expect(incidents).toEqual([
      expect.objectContaining({
        type: 'unauthorized',
        source: 'refresh',
        code: '4004',
        credentialGeneration: generationAtSignIn,
      }),
    ])
    unsubscribe()
  })

  it('keeps the credential when the reissue envelope declares a non-credential failure', async () => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    setAccessToken('old-token')
    setLoginId('manager_id')
    registerReissueTokenReader(readEnvelopeAccessToken)
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    server.use(
      http.post(PING, () => HttpResponse.json({}, { status: 401 })),
      http.post(REISSUE, () =>
        HttpResponse.json({ header: { resultCode: 2100, resultMessage: 'NOT EXIST' }, data: null }),
      ),
    )

    const error = await expectApiError(ping(), 'business')

    expect(error).toMatchObject({ code: '2100' })
    expect(error.message).not.toContain('NOT EXIST')
    // 자격증명 거부가 아니므로 세션을 끝내지 않는다. 로그인 화면으로 튕기지 않고 호출부가 재시도할 수 있다.
    expect(readAccessToken()).toBe('old-token')
    expect(readLoginId()).toBe('manager_id')
    expect(incidents).toEqual([])
    expect(JSON.stringify(log.mock.calls)).not.toContain('NOT EXIST')
    unsubscribe()
  })

  it.each([
    [502, 'server-error'],
    [503, 'server-error'],
  ] as const)(
    'keeps the credential and the original %s kind when reissue fails for a non-credential reason',
    async (status, kind) => {
      setAccessToken('old-token')
      setLoginId('manager_id')
      const incidents: Incident[] = []
      const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
      server.use(
        http.post(PING, () => HttpResponse.json({}, { status: 401 })),
        http.post(REISSUE, () =>
          HttpResponse.json({}, { status, headers: { 'x-request-id': 'req-refresh-failure' } }),
        ),
      )

      const error = await expectApiError(ping(), kind)

      expect(error).toMatchObject({ status, requestId: 'req-refresh-failure' })
      expect(readAccessToken()).toBe('old-token')
      expect(readLoginId()).toBe('manager_id')
      expect(incidents).toEqual([])
      unsubscribe()
    },
  )

  it('keeps the credential and the network kind when the reissue request never reaches the server', async () => {
    setAccessToken('old-token')
    setLoginId('manager_id')
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    server.use(
      http.post(PING, () => HttpResponse.json({}, { status: 401 })),
      http.post(REISSUE, () => HttpResponse.error()),
    )

    await expectApiError(ping(), 'network')

    expect(readAccessToken()).toBe('old-token')
    expect(incidents).toEqual([])
    unsubscribe()
  })

  it.each([
    ['ko', 'ko'],
    ['ja', 'ja'],
    ['en', null],
  ] as const)('UI locale %s에 맞는 locale 헤더를 보낸다', async (locale, xLocale) => {
    registerLocaleGetter(() => locale)
    let acceptLanguage: string | null = null
    let rehearsalLocale: string | null = null
    server.use(
      http.post(PING, ({ request }) => {
        acceptLanguage = request.headers.get('accept-language')
        rehearsalLocale = request.headers.get('x-locale')
        return successful()
      }),
    )

    await ping()

    expect(acceptLanguage).toBe(locale)
    expect(rehearsalLocale).toBe(xLocale)
  })

  it('a replayed 401 terminates with an api-source incident and clears the dead credential', async () => {
    setAccessToken('old-token')
    setLoginId('manager_id')
    const generationAtSignIn = readCredentialGeneration()
    registerReissueTokenReader(() => 'new-token')
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    server.use(
      http.post(PING, () => HttpResponse.json({}, { status: 401 })),
      http.post(REISSUE, () => successful({ accessToken: 'new-token' })),
    )

    await expectApiError(ping(), 'unauthorized')
    expect(incidents).toEqual([
      expect.objectContaining({
        type: 'unauthorized',
        source: 'api',
        status: 401,
        // 재발급이 성공해 세대가 한 번 올랐고, 죽은 것은 그 세대의 자격증명이다.
        credentialGeneration: generationAtSignIn + 1,
      }),
    ])
    // 지우지 않으면 라우트 가드가 다시 통과시키고 같은 401 흐름이 반복된다.
    expect(readAccessToken()).toBeNull()
    expect(readLoginId()).toBeNull()
    unsubscribe()
  })

  it('leaves a pre-auth 401 to the calling screen without ending the session', async () => {
    /**
     * sign-in·2FA 의 401 은 틀린 자격증명이지 기존 세션의 종료가 아니다.
     * 로그인 화면은 저장된 자격증명이 아직 살아 있는 동안에도 열릴 수 있으므로,
     * 여기서 비밀번호를 틀린 것이 세션을 죽이거나 로그인 요구를 발행해서는 안 된다.
     */
    setAccessToken('live-session-token')
    setLoginId('manager_id')
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    let reissueCalls = 0
    server.use(
      http.post(SIGN_IN, () =>
        HttpResponse.json(
          { header: { resultCode: 401, resultMessage: 'UNAUTHORIZED' }, data: null },
          { status: 401 },
        ),
      ),
      http.post(REISSUE, () => {
        reissueCalls += 1
        return successful({ accessToken: 'unexpected-token' })
      }),
    )

    const error = await expectApiError(
      signIn({ id: 'operator', password: 'wrong' }),
      'unauthorized',
    )

    expect(error.code).toBe('401')
    expect(reissueCalls).toBe(0)
    expect(incidents).toEqual([])
    expect(readAccessToken()).toBe('live-session-token')
    expect(readLoginId()).toBe('manager_id')
    unsubscribe()
  })

  /**
   * 봉투가 선언한 세션 만료는 HTTP 200 으로 도착한다. transport 경계가 발행하지 않으면
   * `error-outcome` 은 incident 로 판정하는데 `IncidentBoundary` 에는 아무것도 오지 않는다.
   */
  it('ends the session when a protected response declares an expired session in the envelope', async () => {
    setAccessToken('live-token')
    setLoginId('manager_id')
    const generationAtSignIn = readCredentialGeneration()
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    let reissueCalls = 0
    server.use(
      http.post(PING, () =>
        HttpResponse.json(
          { header: { resultCode: 4004, resultMessage: 'SESSION EXPIRED' }, data: null },
          { headers: { 'x-request-id': 'req-envelope-session' } },
        ),
      ),
      http.post(REISSUE, () => {
        reissueCalls += 1
        return successful({ accessToken: 'unexpected-token' })
      }),
    )

    const error = await expectApiError(ping(), 'unauthorized')

    expect(error).toMatchObject({ code: '4004', status: 200, requestId: 'req-envelope-session' })
    expect(error.message).not.toContain('SESSION EXPIRED')
    // 봉투 실패는 HTTP 401 이 아니므로 재발급 흐름을 타지 않는다.
    expect(reissueCalls).toBe(0)
    expect(readAccessToken()).toBeNull()
    expect(readLoginId()).toBeNull()
    expect(incidents).toEqual([
      expect.objectContaining({
        type: 'unauthorized',
        source: 'api',
        code: '4004',
        credentialGeneration: generationAtSignIn,
      }),
    ])
    unsubscribe()
  })

  it('leaves a pre-auth envelope credential failure to the calling screen', async () => {
    setAccessToken('live-session-token')
    setLoginId('manager_id')
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    server.use(
      http.post(SIGN_IN, () =>
        HttpResponse.json({ header: { resultCode: 4004, resultMessage: 'SESSION EXPIRED' }, data: null }),
      ),
    )

    const error = await expectApiError(signIn({ id: 'operator', password: 'wrong' }), 'unauthorized')

    expect(error.code).toBe('4004')
    expect(incidents).toEqual([])
    expect(readAccessToken()).toBe('live-session-token')
    expect(readLoginId()).toBe('manager_id')
    unsubscribe()
  })

  it('keeps the session when a protected response declares an unmapped business failure', async () => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    setAccessToken('live-token')
    setLoginId('manager_id')
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    server.use(
      http.post(PING, () =>
        HttpResponse.json({ header: { resultCode: 2100, resultMessage: 'NOT EXIST' }, data: null }),
      ),
    )

    const error = await expectApiError(ping(), 'business')

    expect(error).toMatchObject({ code: '2100', status: 200 })
    expect(incidents).toEqual([])
    expect(readAccessToken()).toBe('live-token')
    expect(readLoginId()).toBe('manager_id')
    expect(JSON.stringify(log.mock.calls)).not.toContain('NOT EXIST')
    unsubscribe()
  })

  it('HTTP 403은 forbidden incident 사실을 발행한다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    server.use(
      http.post(PING, () =>
        HttpResponse.json(
          { header: { resultCode: 403, resultMessage: 'FORBIDDEN' }, data: null },
          { status: 403 },
        ),
      ),
    )

    await expectApiError(ping(), 'forbidden')

    expect(incidents).toEqual([expect.objectContaining({ type: 'forbidden', status: 403, code: '403' })])
    unsubscribe()
  })
})
