import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/env'
import { ApiError, type ApiErrorKind } from '../error'
import { isPreAuthPath, readAccessToken } from './credential'
import { readFailureEnvelope } from './envelope'
import { publishIncident } from './incident'
import { readLocale, readRehearsalLocale } from './locale'
import { emitSessionExpiry } from './session'

export const client = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

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

client.interceptors.response.use(
  (response) => {
    emitSessionExpiry(readResponseHeader(response, 'x-session-expires'))
    return response
  },
  (error: unknown) => {
    if (axios.isCancel(error)) {
      return Promise.reject(new ApiError({ kind: 'cancelled', message: 'request cancelled' }))
    }
    if (!axios.isAxiosError(error)) {
      return Promise.reject(
        new ApiError({ kind: 'contract', message: 'unexpected transport interceptor failure' }),
      )
    }

    const requestId = readResponseHeader(error.response, 'x-request-id')
    emitSessionExpiry(readResponseHeader(error.response, 'x-session-expires'))
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return Promise.reject(new ApiError({ kind: 'timeout', message: 'request timeout', requestId }))
    }
    if (!error.response) {
      return Promise.reject(new ApiError({ kind: 'network', message: 'network error', requestId }))
    }

    const { code, fieldErrors, resultMessage } = readFailureEnvelope(error.response.data)
    const status = error.response.status
    const kind = classifyHttpStatus(status)
    if (resultMessage !== undefined && import.meta.env.DEV) {
      console.warn('API HTTP failure', { status, code, resultMessage, requestId })
    }
    if (kind === 'unauthorized') {
      publishIncident({ type: 'session-terminated', status, code, requestId })
    } else if (kind === 'forbidden') {
      publishIncident({ type: 'forbidden', status, code, requestId })
    }

    return Promise.reject(
      new ApiError({
        kind,
        message: `http ${status}`,
        status,
        code,
        requestId,
        fieldErrors,
      }),
    )
  },
)
