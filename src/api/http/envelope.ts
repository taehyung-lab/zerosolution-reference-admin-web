import { ApiError, type ApiFieldError } from '../error'

/**
 * 격리된 리허설 계약의 응답 봉투. 신규 제품 계약으로 승격하지 않는다.
 * TRANSPLANT_PENDING_ENVELOPE: 신규 OpenAPI가 확정되면 봉투 shape·성공 코드·field error 형식을 그 계약으로 교체한다.
 */
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
    const kind = 'business' as const
    if (import.meta.env.DEV) {
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
