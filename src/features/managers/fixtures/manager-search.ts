import type { ManagerSearch } from "../api/manager-search";

/** API 테스트의 검색 입력이다. 화면의 URL 기본값 정책을 대신하지 않는다. */
export const managerSearchDefaults = {
  keywords: [],
  periodType: "CREATED_AT",
  types: [],
  statuses: [],
  agencyIds: [],
  registrationRouteTypes: [],
  sortType: "CREATED_AT",
  sortDirection: "DESC",
  page: 1,
  pageSize: 100,
  startDateTime: undefined,
  endDateTime: undefined,
} as const satisfies ManagerSearch;
