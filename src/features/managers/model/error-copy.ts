/**
 * 정규화된 오류 종류를 운영자 화면에서 보여줄 안전한 번역 키로 변환한다.
 * 실제 API에서도 필요하며 서버 메시지나 내부 오류 내용을 그대로 화면에 출력하지 않는다.
 */
import type { ApiErrorKind } from '@/api/error';

export type SafeErrorKey =
  | 'error.kind.network'
  | 'error.kind.timeout'
  | 'error.kind.cancelled'
  | 'error.kind.business'
  | 'error.kind.unauthorized'
  | 'error.kind.forbidden'
  | 'error.kind.validation'
  | 'error.kind.notFound'
  | 'error.kind.conflict'
  | 'error.kind.rateLimited'
  | 'error.kind.serverError'
  | 'error.kind.contract';

export function safeErrorKey(kind: ApiErrorKind | undefined): SafeErrorKey {
  switch (kind) {
    case 'network':
      return 'error.kind.network';
    case 'timeout':
      return 'error.kind.timeout';
    case 'cancelled':
      return 'error.kind.cancelled';
    case 'business':
      return 'error.kind.business';
    case 'unauthorized':
      return 'error.kind.unauthorized';
    case 'forbidden':
      return 'error.kind.forbidden';
    case 'validation':
      return 'error.kind.validation';
    case 'not-found':
      return 'error.kind.notFound';
    case 'conflict':
      return 'error.kind.conflict';
    case 'rate-limited':
      return 'error.kind.rateLimited';
    case 'server-error':
      return 'error.kind.serverError';
    case 'contract':
      return 'error.kind.contract';
    default:
      return 'error.kind.serverError';
  }
}
