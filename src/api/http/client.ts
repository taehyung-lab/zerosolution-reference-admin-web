import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/env'
import { ApiError, type ApiErrorKind } from '../error'
import {
  readAccessToken,
  readLoginId,
  readReissuedAccessToken,
  setAccessToken,
  isPreAuthPath,
} from './credential'
import {
  classifyResultCode,
  isEnvelope,
  readFailureEnvelope,
  SUCCESS_RESULT_CODE,
} from './envelope'
import { publishIncident, publishTerminalUnauthorized } from './incident'
import { readLocale, readRehearsalLocale } from './locale'

export const client = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

const reissueClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT_MS,
  withCredentials: true,
})

/**
 * TRANSPLANT_PENDING_REISSUE_PATH: 이 경로와 `{ id }` body 는 격리된 리허설 계약에서 읽은 값이다.
 * 신규 백엔드 OpenAPI 가 확정되면 그 계약의 endpoint·request body·응답 reader 로 다시 확인한다.
 */
const REISSUE_PATH = '/api/v1/auth/reissue'
const REFRESH_LOCK_NAME = 'zero-plus-auth-reissue'

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
  _rotationRetry?: boolean
}

let refreshPromise: Promise<string> | null = null

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const locale = readLocale()
  config.headers.set('Accept-Language', locale)
  const rehearsalLocale = readRehearsalLocale(locale)
  if (rehearsalLocale === undefined) config.headers.delete('X-Locale')
  else config.headers.set('X-Locale', rehearsalLocale)

  if (!isPreAuthPath(config.url)) {
    const token = readAccessToken()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

export function readResponseHeader(
  response: AxiosResponse<unknown, unknown> | undefined,
  name: string,
): string | undefined {
  if (response === undefined) return undefined
  const headers: unknown = response.headers
  if (typeof headers !== 'object' || headers === null) return undefined
  const get = (headers as { get?: unknown }).get
  if (typeof get === 'function') {
    const value: unknown = (get as (headerName: string) => unknown).call(headers, name)
    return typeof value === 'string' ? value : undefined
  }
  const record = headers as Record<string, unknown>
  const value = record[name.toLowerCase()] ?? record[name]
  return typeof value === 'string' ? value : undefined
}

function classifyHttpStatus(status: number): ApiErrorKind {
  if (status === 400) return 'validation'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  if (status === 409) return 'conflict'
  if (status === 429) return 'rate-limited'
  if (status >= 500 && status <= 599) return 'server-error'
  return 'contract'
}

function readBearerToken(request: RetryableRequest): string | null {
  const authorization = request.headers.get('Authorization')
  return typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null
}

function normalizeAxiosFailure(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return new ApiError({ kind: 'contract', message: 'unexpected transport failure' })
  }
  const requestId = readResponseHeader(error.response, 'x-request-id')
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError({ kind: 'timeout', message: 'request timeout', requestId })
  }
  if (!error.response) return new ApiError({ kind: 'network', message: 'network error', requestId })
  const { code, fieldErrors } = readFailureEnvelope(error.response.data)
  const status = error.response.status
  return new ApiError({
    kind: classifyHttpStatus(status),
    message: `http ${status}`,
    status,
    code,
    requestId,
    fieldErrors,
  })
}

/**
 * 재발급 실패 중 terminal 은 "서버가 자격증명을 거부한 경우"뿐이다.
 * 네트워크 단절·타임아웃·5xx 는 자격증명 판정이 아니므로 원래 kind 를 보존해 호출부가
 * 재시도할 수 있게 두고, 저장된 토큰도 지우지 않는다. 이것을 모두 unauthorized 로 접으면
 * 서버가 잠깐 죽은 동안에도 사용자가 로그인 화면으로 튕긴다.
 */
function isCredentialRejection(error: ApiError): boolean {
  return error.status === 401 || error.status === 403
}

/**
 * 죽은 자격증명을 지우고 로그인 요구 사실을 발행한다.
 * 지우지 않으면 다음 요청이 다시 401 -> 재발급 -> 실패로 돈다.
 */
function terminalReissueFailure(normalized: ApiError): ApiError {
  const terminal = new ApiError({
    kind: 'unauthorized',
    message: 'authentication reissue failed',
    status: normalized.status,
    code: normalized.code,
    requestId: normalized.requestId,
  })
  publishTerminalUnauthorized('refresh', terminal)
  return terminal
}

/**
 * 봉투가 선언한 실패. HTTP 200 이어도 서버는 재발급을 거절했다.
 * 어떤 실패인지는 ADR 0001 의 resultCode 표가 정하며 자격증명 거부만 terminal 이다.
 */
function readDeclaredEnvelopeFailure(
  payload: unknown,
): { readonly code: string; readonly kind: ApiErrorKind } | undefined {
  if (!isEnvelope(payload)) return undefined
  const resultCode = payload.header.resultCode
  if (resultCode === SUCCESS_RESULT_CODE) return undefined
  return { code: String(resultCode), kind: classifyResultCode(resultCode) }
}

async function requestReissue(): Promise<string> {
  const loginId = readLoginId()
  if (loginId === null) {
    // 계약이 body 에 로그인 ID 를 요구한다. 저장된 ID 가 없으면 요청 자체를 만들 수 없으므로 다시 로그인해야 한다.
    throw terminalReissueFailure(
      new ApiError({ kind: 'unauthorized', message: 'stored login id is missing' }),
    )
  }

  let response: AxiosResponse<unknown>
  try {
    response = await reissueClient.post<unknown>(REISSUE_PATH, { id: loginId })
  } catch (error) {
    const normalized = normalizeAxiosFailure(error)
    if (isCredentialRejection(normalized)) throw terminalReissueFailure(normalized)
    throw normalized
  }

  const requestId = readResponseHeader(response, 'x-request-id')
  const declaredFailure = readDeclaredEnvelopeFailure(response.data)
  if (declaredFailure !== undefined) {
    const rejection = new ApiError({
      kind: declaredFailure.kind,
      message: 'reissue rejected by server',
      status: response.status,
      code: declaredFailure.code,
      requestId,
    })
    if (declaredFailure.kind === 'unauthorized') throw terminalReissueFailure(rejection)
    throw rejection
  }

  const token = readReissuedAccessToken(response.data)
  if (!token) {
    throw new ApiError({
      kind: 'contract',
      message: 'reissue response adapter is not configured for the backend contract',
      status: response.status,
      requestId,
    })
  }
  setAccessToken(token)
  return token
}

function refreshAcrossTabs(previousToken: string | null): Promise<string> {
  if (typeof navigator === 'undefined' || navigator.locks === undefined) return requestReissue()
  return navigator.locks.request(REFRESH_LOCK_NAME, () => {
    const currentToken = readAccessToken()
    if (currentToken && currentToken !== previousToken) return Promise.resolve(currentToken)
    return requestReissue()
  }).then((token) => token)
}

function acquireRefresh(previousToken: string | null): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAcrossTabs(previousToken).finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function retryAfterRefresh(request: RetryableRequest): Promise<unknown> {
  request._retry = true
  const token = await acquireRefresh(readBearerToken(request))
  request.headers.set('Authorization', `Bearer ${token}`)
  return client(request)
}

client.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isCancel(error)) {
      return Promise.reject(new ApiError({ kind: 'cancelled', message: 'request cancelled' }))
    }
    if (!axios.isAxiosError(error)) return Promise.reject(normalizeAxiosFailure(error))

    const request = error.config as RetryableRequest | undefined
    const status = error.response?.status
    const isReissue = isPreAuthPath(request?.url) && request?.url?.includes('reissue') === true
    const canRefresh =
      status === 401 && request !== undefined && !request._retry && !isPreAuthPath(request.url)

    if (canRefresh) return retryAfterRefresh(request)

    if (
      status === 401 &&
      request !== undefined &&
      request._retry &&
      !request._rotationRetry &&
      !isReissue
    ) {
      const currentToken = readAccessToken()
      const usedToken = readBearerToken(request)
      if (currentToken && usedToken && currentToken !== usedToken) {
        request._rotationRetry = true
        request.headers.set('Authorization', `Bearer ${currentToken}`)
        return client(request)
      }
    }

    const requestId = readResponseHeader(error.response, 'x-request-id')
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return Promise.reject(new ApiError({ kind: 'timeout', message: 'request timeout', requestId }))
    }
    if (!error.response) {
      return Promise.reject(new ApiError({ kind: 'network', message: 'network error', requestId }))
    }

    const { code, fieldErrors } = readFailureEnvelope(error.response.data)
    const responseStatus = error.response.status
    const kind = classifyHttpStatus(responseStatus)
    const normalized = new ApiError({
        kind,
        message: `http ${responseStatus}`,
        status: responseStatus,
        code,
        requestId,
        fieldErrors,
      })
    if (kind === 'unauthorized' && !isPreAuthPath(request?.url)) {
      /**
       * pre-auth 요청(sign-in·2FA)의 401 은 틀린 자격증명이지 세션의 종료가 아니므로 제외한다.
       * 그 실패는 호출한 화면이 인라인 오류로 처리한다.
       *
       * 여기 도달한 나머지 401 은 재발급을 이미 거쳐 온 replay 실패다(첫 401 은 위에서 재발급으로 간다).
       * 세션이 끝난 것이 확정이므로 죽은 자격증명을 지운다. 남겨 두면 라우트 가드가 다시
       * 통과시키고 같은 401 흐름이 반복된다.
       */
      publishTerminalUnauthorized('api', normalized)
    } else if (kind === 'forbidden') {
      publishIncident({ type: 'forbidden', status: responseStatus, code, requestId, error: normalized })
    }

    return Promise.reject(normalized)
  },
)
