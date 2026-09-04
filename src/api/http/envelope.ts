import { ApiError, type ApiErrorKind, type ApiFieldError } from '../error'

/**
 * 격리된 리허설 계약의 응답 봉투. 신규 제품 계약으로 승격하지 않는다.
 * TRANSPLANT_PENDING_ENVELOPE: 신규 OpenAPI가 확정되면 봉투 shape·성공 코드·field error 형식을 그 계약으로 교체한다.
 */
export interface Envelope<T> {
  header: { resultCode: number; resultMessage?: string }
  data?: T
}

export const SUCCESS_RESULT_CODE = 200

/**
 * HTTP 200 실패 봉투의 resultCode 판정표. ADR 0001 "HTTP 200 응답의 resultCode 매핑" 이 정본이다.
 * 여기 없는 code 는 서버가 업무 실패를 선언했다는 사실만 뜻하는 `business` 이며 회복 의미를 주장하지 않는다.
 * code 를 추가하려면 실서버 관측이나 백엔드 확인이 먼저이고, 그때 ADR 표와 이 표를 함께 바꾼다.
 */
const DECLARED_FAILURE_KINDS = new Map<number, ApiErrorKind>([
  [400, 'validation'],
  [401, 'unauthorized'],
  [4004, 'unauthorized'],
])

export function classifyResultCode(resultCode: number): ApiErrorKind {
  return DECLARED_FAILURE_KINDS.get(resultCode) ?? 'business'
}

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

/** HTTP 실패 본문에서 UI-safe canonical 값만 읽는다. */
export function readFailureEnvelope(payload: unknown): {
  code: string | undefined
  fieldErrors: readonly ApiFieldError[]
} {
  if (!isEnvelope(payload)) {
    return { code: undefined, fieldErrors: [] }
  }
  const resultCode = payload.header.resultCode
  return {
    code: String(resultCode),
    fieldErrors: normalizeFieldErrors(payload.data),
  }
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
    const kind = classifyResultCode(resultCode)
    if (import.meta.env.DEV && kind === 'business') {
      console.warn('Unmapped API business code', { resultCode, requestId })
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
