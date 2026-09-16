import { queryOptions } from '@tanstack/react-query';
import { inlineProgress } from '@/api/query-meta';
import type { UiLocale } from '@/shared/i18n/locale';
import {
  readManagerDetail,
  readManagerListPage,
  readManagerPermissionOptions,
  readManagerTypeOptions,
} from '../fixtures/managers';
import type { ManagerListRequest } from '../model/manager';
import { managerQueryKeys } from './keys';

/**
 * 운영자 조회의 유일한 query 선언들. 화면·route loader·테스트가 같은 정의를 소비한다.
 *
 * TRANSPLANT_PENDING_MANAGER_QUERY: queryFn 은 아직 임시 응답 함수다. 실제 endpoint 가 확정되면
 * 여기서 생성된 operation 을 호출하고 fixtures 를 지운다. 요청 입력과 캐시 키는 화면이 해소한 같은
 * 값이므로 그때도 바뀌지 않는다.
 */
export function managerListQueryOptions(locale: UiLocale, request: ManagerListRequest) {
  return queryOptions({
    queryKey: managerQueryKeys.list(locale, request),
    queryFn: () => readManagerListPage(request),
  });
}

/** 운영자 한 건. 조회 화면과 수정 화면, 두 route loader 가 같은 정의를 쓴다. */
export function managerDetailQueryOptions(locale: UiLocale, managerId: string) {
  return queryOptions({
    queryKey: managerQueryKeys.detail(locale, managerId),
    queryFn: () => readManagerDetail(managerId),
  });
}

/** 유형 옵션은 선행 조건이 없어 목록 필터와 등록·수정 폼이 같은 캐시를 쓴다. */
export function managerTypeOptionsQuery(locale: UiLocale) {
  return queryOptions({
    queryKey: managerQueryKeys.typeOptions(locale),
    queryFn: () => readManagerTypeOptions(),
    staleTime: Infinity,
    ...inlineProgress,
  });
}

/**
 * 권한 옵션의 범위. 목록 필터는 사용 중인 전체 권한(`type` 없음), 등록·수정은 선택한 유형에 종속된
 * 권한만 쓴다(11-settings.md 11.1). 폼에서 유형을 고르기 전(`enabled: false`)에는 조회하지 않는다.
 */
export function managerPermissionOptionsQuery(
  locale: UiLocale,
  scope: { readonly type?: string; readonly enabled: boolean },
) {
  return queryOptions({
    queryKey: managerQueryKeys.permissionOptions(locale, scope.type),
    queryFn: () => readManagerPermissionOptions(scope.type),
    enabled: scope.enabled,
    staleTime: Infinity,
    ...inlineProgress,
  });
}
