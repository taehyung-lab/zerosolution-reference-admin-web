import { ApiError, type ApiErrorKind, type ApiFieldError } from '../error'
import { publishIncident } from './incident'

/** 격리된 리허설 계약의 응답 봉투. 신규 제품 계약으로 승격하지 않는다. */
export interface Envelope<T> {
  header: { resultCode: number; resultMessage?: string }
  data?: T
}

export const SUCCESS_RESULT_CODE = 200

export function isEnvelope(value: unknown): value is Envelope<unknown> {
  if (typeof value !== 'object' || value === null || !('header' in value)) return false
  const header = value.header
  return (
    typeof header === 'object' &&
    header !== null &&
    'resultCode' in header &&
    typeof header.resultCode === 'number'
  )
}

export function normalizeFieldErrors(data: unknown): readonly ApiFieldError[] {
  if (!Array.isArray(data)) return []
  const result: ApiFieldError[] = []
  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue
    const record = item as Record<string, unknown>
    const field = record['field']
    const code = record['validCode'] ?? record['code']
    if (typeof field === 'string' && typeof code === 'string') result.push({ field, code })
  }
  return result
}

/** HTTP 실패 본문에서 UI-safe canonical 값과 개발 로그용 원문을 분리해 읽는다. */
export function readFailureEnvelope(payload: unknown): {
  code: string | undefined
  fieldErrors: readonly ApiFieldError[]
  resultMessage: string | undefined
} {
  if (!isEnvelope(payload)) {
    return { code: undefined, fieldErrors: [], resultMessage: undefined }
  }
  const resultCode = payload.header.resultCode
  const resultMessage = payload.header.resultMessage
  return {
    code: String(resultCode),
    fieldErrors: normalizeFieldErrors(payload.data),
    resultMessage: typeof resultMessage === 'string' ? resultMessage : undefined,
  }
}

function classifyBusinessFailure(resultCode: number): ApiErrorKind {
  if (resultCode === 4004 || resultCode === 401) return 'unauthorized'
  if (resultCode === 400) return 'validation'

  // 미매핑 코드는 회복 행동을 추측하지 않는다. 실서버 관측 또는 백엔드 확인 전에는
  // 업무 실패라는 사실만 보존하고, dev 경고로 매핑 누락을 드러낸다(ADR 0001).
  return 'business'
}

export function unwrapEnvelope<T>(payload: Envelope<T>, requestId?: string): T
export function unwrapEnvelope(payload: unknown, requestId?: string): unknown
export function unwrapEnvelope(payload: unknown, requestId?: string): unknown {
  if (!isEnvelope(payload)) {
    throw new ApiError({
      kind: 'contract',
      message: 'response envelope does not match the declared contract',
      status: 200,
      requestId,
    })
  }

  const resultCode = payload.header.resultCode
  if (resultCode !== SUCCESS_RESULT_CODE) {
    const kind = classifyBusinessFailure(resultCode)
    const resultMessage = payload.header.resultMessage
    if (import.meta.env.DEV) {
      const label = kind === 'business' ? 'Unmapped API business code' : 'API business failure'
      console.warn(label, { resultCode, resultMessage, requestId })
    }
    if (kind === 'unauthorized') {
      publishIncident({ type: 'session-terminated', status: 200, code: String(resultCode), requestId })
    }
    throw new ApiError({
      kind,
      message: 'request rejected by server',
      code: String(resultCode),
      status: 200,
      requestId,
      fieldErrors: normalizeFieldErrors(payload.data),
    })
  }
  return payload.data
}
