/**
 * 운영자 조회 요청 조건 변환과 생성 API를 실행하는 query options를 선언한다.
 * 실제 API에서도 남는 연결부다. endpoint·DTO는 OpenAPI에 맞춰 교체하고, 화면의 선택/폼 상태는 이 파일에 넣지 않는다.
 */
import {
  get8,
  getAgencies,
  getForEdit1,
  getList8,
  getManagerTypes,
  getPermissions,
} from '@/api/generated/endpoints';
import type {
  CnJsonPagingResultPagingDataMrManagerDTOInventory,
  GetList8Params,
  GetPermissionsType,
  MrManagerDTODetail,
  MrManagerDTOEditDetail,
} from '@/api/generated/models';
import type { UiLocale } from '@/shared/i18n/locale';
import { nonEmptyArray } from '@/shared/lib/search';
import { blockingProgress, inlineProgress } from '@/api/query-meta';
import { queryOptions } from '@tanstack/react-query';
import type { ManagerSearch } from '../list/model/search-schema';
import { managerKeys } from './keys';

/** 확정 화면 검색값을 기존 API 필드명과 빈 배열 생략 규칙으로 변환한다. 실제 API에서도 필요한 요청 mapper다. */
export function toManagerListParams(search: ManagerSearch): GetList8Params {
  const keywords = nonEmptyArray(search.keywords);
  const types = nonEmptyArray(search.types);
  const statuses = nonEmptyArray(search.statuses);
  const agencyIds = nonEmptyArray(search.agencyIds);
  const registrationRouteTypes = nonEmptyArray(search.registrationRouteTypes);

  return {
    periodType: search.periodType,
    ...(keywords ? { keywords } : {}),
    ...(types ? { types } : {}),
    ...(statuses ? { statuses } : {}),
    ...(agencyIds ? { agencyIds } : {}),
    ...(registrationRouteTypes ? { registrationRouteTypes } : {}),
    sortType: search.sortType,
    sortDirection: search.sortDirection,
    pageNo: search.page,
    pageSize: search.pageSize,
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
  };
}

/** 같은 변환 params를 캐시 키와 생성 API 호출에 함께 사용해 다른 검색 결과가 섞이지 않게 한다. */
export function managerListQuery(locale: UiLocale, search: ManagerSearch) {
  const params = toManagerListParams(search);
  return queryOptions({
    queryKey: managerKeys.list(locale, params),
    queryFn: async (): Promise<CnJsonPagingResultPagingDataMrManagerDTOInventory> =>
      getList8(params),
  });
}
/** 표시용 상세를 조회한다. 수정용 원본 조회와 캐시를 구분한다. */
export function managerDetailQuery(locale: UiLocale, id: string) {
  return queryOptions({
    queryKey: managerKeys.detail(locale, id),
    queryFn: async (): Promise<MrManagerDTODetail> => get8(id),
    ...blockingProgress,
  });
}

/** 목록 검색 전에도 필요한 운영자 유형 옵션을 독립 캐시로 조회한다. */
export function managerTypeOptionsQuery(locale: UiLocale) {
  return queryOptions({
    queryKey: managerKeys.typeOptions(locale),
    queryFn: () => getManagerTypes(),
    staleTime: Infinity,
    ...inlineProgress,
  });
}

/** 수정 초기값용 상세를 조회한다. 편집 중 초기값 재주입을 피하는 캐시 정책을 이 조회가 소유한다. */
export function managerEditDetailQuery(locale: UiLocale, id: string) {
  return queryOptions({
    queryKey: managerKeys.editDetail(locale, id),
    queryFn: async (): Promise<MrManagerDTOEditDetail> => getForEdit1(id),
    // 수정 진입값은 폼 defaults 로 한 번만 복사된다. 배경 refetch 가 편집 중인 입력과
    // 경쟁하지 않도록 화면이 살아 있는 동안 stale 로 만들지 않는다.
    staleTime: Infinity,
    gcTime: 0,
    ...blockingProgress,
  });
}

/**
 * 권한 옵션은 선택된 유형에 종속된다(리허설 계약의 `GET /options/permissions?type=`).
 * 유형이 없으면 조회하지 않는다. 어떤 유형에 어떤 권한이 열리는지는 feature 가 소유한다.
 */
export function managerPermissionOptionsQuery(
  locale: UiLocale,
  type: GetPermissionsType | undefined,
) {
  return queryOptions({
    queryKey: managerKeys.permissionOptions(locale, type),
    queryFn: () => getPermissions(type === undefined ? undefined : { type }),
    enabled: type !== undefined,
    staleTime: Infinity,
    ...inlineProgress,
  });
}

/** 기획사 선택용 원본 옵션을 조회한다. value/label 변환은 옵션 소비 훅에서 한다. */
export function managerAgencyOptionsQuery(locale: UiLocale) {
  return queryOptions({
    queryKey: managerKeys.agencyOptions(locale),
    queryFn: getAgencies,
    staleTime: Infinity,
    ...inlineProgress,
  });
}
