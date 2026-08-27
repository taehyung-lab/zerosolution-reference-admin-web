/**
 * 의미 기반 오류 분류. HTTP 상태 코드를 UI에 그대로 노출하지 않는다.
 * 상세 규칙의 단일 출처는 .agents/skills/api-contract/references/transport.md 다.
 */
export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'business'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'rate-limited'
  | 'server-error'
  | 'contract'

export interface ApiFieldError {
  readonly field: string
  readonly code: string
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly code: string | undefined
  readonly status: number | undefined
  readonly requestId: string | undefined
  readonly fieldErrors: readonly ApiFieldError[]

  constructor(init: {
    kind: ApiErrorKind
    message: string
    code?: string | undefined
    status?: number | undefined
    requestId?: string | undefined
    fieldErrors?: readonly ApiFieldError[]
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.kind = init.kind
    this.code = init.code
    this.status = init.status
    this.requestId = init.requestId
    this.fieldErrors = init.fieldErrors ?? []
  }
}
