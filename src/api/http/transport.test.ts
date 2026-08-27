import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosAdapter } from 'axios'
import { http, HttpResponse } from 'msw'
import { ping, signIn } from '@/api/generated/endpoints'
import { server } from '@/test/msw/server'
import { ApiError, type ApiErrorKind } from '../error'
import { client } from './client'
import { registerTokenGetter } from './credential'
import { beginSessionEpoch, subscribeIncident, type Incident } from './incident'
import { registerLocaleGetter } from './locale'
import { registerSessionExpiryObserver } from './session'
import { customInstance } from './mutator'

const ORIGIN = 'http://localhost:3000'
const SIGN_IN = `${ORIGIN}/api/v1/auth/sign-in`
const REISSUE = `${ORIGIN}/api/v1/auth/reissue`
const TWO_FA = `${ORIGIN}/api/v1/auth/2fa/email/send`
const PING = `${ORIGIN}/api/v1/auth/ping`
const EXCEL = `${ORIGIN}/api/v1/test/excel-download`

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
  registerTokenGetter(() => null)
  registerLocaleGetter(() => 'ko')
  registerSessionExpiryObserver(() => undefined)
  beginSessionEpoch()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

describe('transport 통합 (생성물 -> mutator -> 봉투 -> 헤더)', () => {
  it('생성된 endpoint를 정확한 경로로 호출하고 성공 봉투를 벗긴다', async () => {
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
    [4004, 'unauthorized'],
    [400, 'validation'],
    [401, 'unauthorized'],
  ] as const)('HTTP 200 + 실패 resultCode %s를 %s로 분류한다', async (resultCode, kind) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    server.use(
      http.post(PING, () =>
        HttpResponse.json(
          { header: { resultCode, resultMessage: '서버 원문' }, data: null },
          { headers: { 'x-request-id': 'req-business' } },
        ),
      ),
    )

    const error = await expectApiError(ping(), kind)

    expect(error).toMatchObject({ status: 200, code: String(resultCode), requestId: 'req-business' })
    expect(error.message).not.toContain('서버 원문')
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

  it.each([
    [401, 'unauthorized'],
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
    registerTokenGetter(() => 'tok-1')
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

  it('유효한 X-Session-Expires를 observer에 발행한다', async () => {
    const observer = vi.fn<(isoString: string) => void>()
    registerSessionExpiryObserver(observer)
    server.use(
      http.post(PING, () => successful(null, { 'X-Session-Expires': '2026-08-27T15:00:00Z' })),
    )

    await ping()

    expect(observer).toHaveBeenCalledWith('2026-08-27T15:00:00Z')
  })

  it('파싱할 수 없는 X-Session-Expires를 발행하지 않고 개발 로그에 남긴다', async () => {
    const observer = vi.fn<(isoString: string) => void>()
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    registerSessionExpiryObserver(observer)
    server.use(http.post(PING, () => successful(null, { 'X-Session-Expires': 'tomorrow' })))

    await ping()

    expect(observer).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith('Invalid X-Session-Expires header', 'tomorrow')
  })

  it('session-terminated incident를 epoch당 한 번만 발행하고 새 epoch에서는 다시 발행한다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const incidents: Incident[] = []
    const unsubscribe = subscribeIncident((incident) => incidents.push(incident))
    server.use(
      http.post(PING, () =>
        HttpResponse.json(
          { header: { resultCode: 401, resultMessage: 'UNAUTHORIZED' }, data: null },
          { status: 401 },
        ),
      ),
    )

    await expectApiError(ping(), 'unauthorized')
    await expectApiError(ping(), 'unauthorized')
    expect(incidents).toHaveLength(1)
    expect(incidents[0]).toMatchObject({ type: 'session-terminated', status: 401, code: '401' })

    beginSessionEpoch()
    await expectApiError(ping(), 'unauthorized')
    expect(incidents).toHaveLength(2)
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

    expect(incidents).toEqual([{ type: 'forbidden', status: 403, code: '403' }])
    unsubscribe()
  })
})
