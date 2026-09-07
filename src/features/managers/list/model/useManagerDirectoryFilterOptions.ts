/**
 * 제품 목록 필터의 유형·권한 옵션을 조회한다. 목록 행과 수명·캐시 키·선행 조건이 달라 목록 Query와 분리한다.
 * 실패를 빈 목록으로 접지 않고 로딩·실패·재시도 사실을 필드까지 넘긴다.
 */
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/shared/i18n/locale-context';
import {
  managerDirectoryPermissionOptionsQuery,
  managerDirectoryTypeOptionsQuery,
} from '../../api/directory-queries';
import {
  toManagerSelectOptions,
  type ManagerSelectOptions,
} from '../../options/manager-select-options';

export interface ManagerDirectoryFilterOptions {
  readonly type: ManagerSelectOptions;
  readonly permission: ManagerSelectOptions;
}

export function useManagerDirectoryFilterOptions(): ManagerDirectoryFilterOptions {
  const { locale } = useLocale();
  const types = useQuery(managerDirectoryTypeOptionsQuery(locale));
  // 목록 필터는 등록·수정과 달리 사용 중인 전체 권한에서 하나를 고른다.
  const permissions = useQuery(managerDirectoryPermissionOptionsQuery(locale, 'all'));
  return {
    type: toManagerSelectOptions(types),
    permission: toManagerSelectOptions(permissions),
  };
}
