import {
  get8,
  getAgencies,
  getForEdit1,
  getList8,
  getManagerTypes,
  getPermissions,
} from "@/api/generated/endpoints";
import type {
  CnJsonPagingResultPagingDataMrManagerDTOInventory,
  GetList8Params,
  GetPermissionsType,
  MrManagerDTODetail,
  MrManagerDTOEditDetail,
} from "@/api/generated/models";
import type { UiLocale } from "@/shared/i18n/locale";
import { nonEmptyArray } from "@/shared/lib/search";
import { blockingProgress, inlineProgress } from "@/api/query-meta";
import { queryOptions } from "@tanstack/react-query";
import type { ManagerSearch } from "../list/search-schema";
import { managerKeys } from "./keys";

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

export function managerListQuery(locale: UiLocale, search: ManagerSearch) {
  const params = toManagerListParams(search);
  return queryOptions({
    queryKey: managerKeys.list(locale, params),
    queryFn:
      async (): Promise<CnJsonPagingResultPagingDataMrManagerDTOInventory> =>
        getList8(params),
  });
}
export function managerDetailQuery(locale: UiLocale, id: string) {
  return queryOptions({
    queryKey: managerKeys.detail(locale, id),
    queryFn: async (): Promise<MrManagerDTODetail> => get8(id),
    ...blockingProgress,
  });
}

export function managerTypeOptionsQuery(locale: UiLocale) {
  return queryOptions({
    queryKey: managerKeys.typeOptions(locale),
    queryFn: () => getManagerTypes(),
    staleTime: Infinity,
    ...inlineProgress,
  });
}

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

export function managerAgencyOptionsQuery(locale: UiLocale) {
  return queryOptions({
    queryKey: managerKeys.agencyOptions(locale),
    queryFn: getAgencies,
    staleTime: Infinity,
    ...inlineProgress,
  });
}
