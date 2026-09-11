import { ApiError, type ApiErrorKind } from '@/api/error'

export type ErrorOperationContext =
  | 'feature'
  | 'pre-auth'
  | 'prefetch'
  | 'render'
  | 'route-loader'
  | 'fatal'
  | 'route-not-found'

export type ErrorOutcome = 'none' | 'feature' | 'incident' | 'root'

function observedFeatureOutcome(kind: ApiErrorKind): ErrorOutcome {
  if (kind === 'cancelled') return 'none'
  if (kind === 'unauthorized' || kind === 'forbidden') return 'incident'
  return 'feature'
}

export function isFeatureError(error: unknown): error is ApiError {
  return error instanceof ApiError && resolveErrorOutcome('feature', error.kind) === 'feature'
}

/** UI placement is decided from the operation that failed, never from kind alone. */
export function resolveErrorOutcome(
  context: ErrorOperationContext,
  kind: ApiErrorKind,
): ErrorOutcome {
  // A route loader's session/access failure is still the incident boundary's (login redirect, access cover);
  // the route's error component renders nothing for it. Everything else at these contexts is a root page.
  if (context === 'route-loader' && (kind === 'unauthorized' || kind === 'forbidden')) return 'incident'
  if (context === 'route-not-found' || context === 'render' || context === 'route-loader' || context === 'fatal') {
    return 'root'
  }
  if (context === 'prefetch' && kind === 'forbidden') return 'none'
  /**
   * 로그인 전 요청의 인증 실패는 틀린 자격증명이지 세션의 종료가 아니다.
   * 이것을 incident 로 보내면 로그인 실패가 화면 안 오류 대신 `/login` 재이동으로 끝난다.
   */
  if (context === 'pre-auth') return kind === 'cancelled' ? 'none' : 'feature'
  return observedFeatureOutcome(kind)
}
