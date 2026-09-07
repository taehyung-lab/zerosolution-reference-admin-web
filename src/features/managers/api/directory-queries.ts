/** 제품 화면의 임시 응답 공급 경계다. 리허설 API enum과 제품 상태를 임의로 대응시키지 않는다. */
import { queryOptions } from '@tanstack/react-query';
import { localizedQueryKey } from '@/api/query-key';
import { blockingProgress, inlineProgress } from '@/api/query-meta';
import { ApiError } from '@/api/error';
import { readManagerDirectoryPage } from '../fixtures/directory-page';
import {
  readManagerDirectoryPermissionOptions,
  readManagerDirectoryTypeOptions,
} from '../fixtures/directory-options';
import { findManagerFixture } from '../fixtures/managers';
import type { ManagerListSearch } from '../list/model/manager-list-search';
export function managerDirectoryQuery(locale: string, search: ManagerListSearch) {
  return queryOptions({ queryKey: [...localizedQueryKey(locale, 'managers', 'directory'), search], queryFn: () => Promise.resolve().then(() => readManagerDirectoryPage(search)) });
}
export function managerDirectoryDetailQuery(locale: string, id: string) {
  return queryOptions({ queryKey: localizedQueryKey(locale, 'managers', 'directory-detail', id), queryFn: () => Promise.resolve().then(() => {
    const record = findManagerFixture(id);
    if (!record) throw new ApiError({ kind: 'not-found', message: '예시 운영자가 없습니다.' });
    return record;
  }), ...blockingProgress });
}
/** 유형 옵션은 선행 조건이 없어 목록 필터와 등록·수정 폼이 같은 캐시를 쓴다. */
export function managerDirectoryTypeOptionsQuery(locale: string) {
  return queryOptions({
    queryKey: localizedQueryKey(locale, 'managers', 'directory-type-options'),
    queryFn: () => Promise.resolve().then(() => readManagerDirectoryTypeOptions()),
    staleTime: Infinity,
    ...inlineProgress,
  });
}

/** 목록 필터가 쓰는 전체 범위와 폼이 쓰는 유형 종속 범위를 값으로 구분한다. */
export type ManagerPermissionOptionScope = 'all' | { readonly type: string };

/**
 * 권한 옵션의 범위를 소비 화면이 인수로 밝힌다. 목록은 사용 중인 전체 권한에서 하나를 고르고
 * 등록·수정만 선택한 유형에 종속된다(11-settings.md 11.1). 유형 선택 전(`undefined`)에는 조회하지 않는다.
 * 실제 endpoint가 확정되면 이 범위를 서버 파라미터로 옮긴다.
 */
export function managerDirectoryPermissionOptionsQuery(
  locale: string,
  scope: ManagerPermissionOptionScope | undefined,
) {
  const type = scope === undefined || scope === 'all' ? undefined : scope.type;
  return queryOptions({
    queryKey: localizedQueryKey(locale, 'managers', 'directory-permission-options', type ?? 'all'),
    queryFn: () => Promise.resolve().then(() => readManagerDirectoryPermissionOptions(type)),
    enabled: scope !== undefined,
    staleTime: Infinity,
    ...inlineProgress,
  });
}
