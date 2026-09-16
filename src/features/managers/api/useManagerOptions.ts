/**
 * 운영자 유형·권한 옵션 조회를 선택 필드 하나의 표시 상태로 바꾼다. 목록 필터와 등록·수정 폼이 같은 계약을
 * 쓴다. 실패를 빈 목록으로 접지 않고 로딩·실패·재시도를 필드까지 전달한다. 캐시된 값이 있으면 ready 다.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useLocale } from '@/shared/i18n/locale-context';
import type { AsyncFieldState } from '@/shared/ui/feedback/AsyncFieldBoundary';
import type { ManagerOption } from '../model/manager';
import { managerPermissionOptionsQuery, managerTypeOptionsQuery } from './queries';

export interface ManagerSelectOptions {
  readonly state: AsyncFieldState;
  readonly items: readonly ManagerOption[];
  readonly retry: () => void;
}

function toSelectOptions(query: UseQueryResult<readonly ManagerOption[]>): ManagerSelectOptions {
  return {
    state: query.data !== undefined ? 'ready' : query.isError ? 'error' : 'loading',
    items: query.data ?? [],
    retry: () => void query.refetch(),
  };
}

export function useManagerTypeOptions(): ManagerSelectOptions {
  const { locale } = useLocale();
  return toSelectOptions(useQuery(managerTypeOptionsQuery(locale)));
}

/**
 * 목록 필터는 `{ enabled: true }`(전체 권한), 폼은 `{ type, enabled: type !== '' }`(선택 유형의 권한).
 * 선행 조건이 아직 없으면 조회하지 않은 빈 ready 다.
 */
export function useManagerPermissionOptions(scope: {
  readonly type?: string;
  readonly enabled: boolean;
}): ManagerSelectOptions {
  const { locale } = useLocale();
  const query = useQuery(managerPermissionOptionsQuery(locale, scope));
  return scope.enabled
    ? toSelectOptions(query)
    : { state: 'ready', items: [], retry: () => undefined };
}
