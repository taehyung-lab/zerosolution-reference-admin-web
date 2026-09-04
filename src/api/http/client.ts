import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/env'
import { ApiError, type ApiErrorKind } from '../error'
import {
  readAccessToken,
  readReissuedAccessToken,
  setAccessToken,
  isPreAuthPath,
} from './credential'
import { readFailureEnvelope } from './envelope'
import { publishIncident } from './incident'
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

// TRANSPLANT_PENDING_REISSUE_PATH: 리허설 경로·응답 body다. 신규 계약의 reissue endpoint와 token reader로 교체한다.
const REISSUE_PATH = '/auth/reissue'
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

async function requestReissue(): Promise<string> {
  try {
    const response = await reissueClient.post<unknown>(REISSUE_PATH)
    const token = readReissuedAccessToken(response.data)
    if (!token) {
      throw new ApiError({
        kind: 'contract',
        message: 'reissue response adapter is not configured for the backend contract',
        status: response.status,
        requestId: readResponseHeader(response, 'x-request-id'),
      })
    }
    setAccessToken(token)
    return token
  } catch (error) {
    const normalized = error instanceof ApiError ? error : normalizeAxiosFailure(error)
    const terminal = new ApiError({
      kind: 'unauthorized',
      message: 'authentication reissue failed',
      status: normalized.status,
      code: normalized.code,
      requestId: normalized.requestId,
    })
    publishIncident({
      type: 'unauthorized',
      source: 'refresh',
      status: terminal.status,
      code: terminal.code,
      requestId: terminal.requestId,
      error: terminal,
    })
    throw terminal
  }
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
    if (kind === 'unauthorized') {
      publishIncident({ type: 'unauthorized', source: 'api', status: responseStatus, code, requestId })
    } else if (kind === 'forbidden') {
      publishIncident({ type: 'forbidden', status: responseStatus, code, requestId, error: normalized })
    }

    return Promise.reject(normalized)
  },
)
