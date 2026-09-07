/**
 * 운영자 목록의 페이지 크기·정렬·페이지 이동 시 URL 조건을 갱신하는 순수 정책이다.
 * API 이후에도 유지한다. 응답 목록을 직접 정렬/분할하는 서버 대역 코드와 구분한다.
 */
import { standardPageSizeOptions } from "@/shared/config/list";
import type { ManagerSearch } from "../../../api/manager-search";

export const managerPageSizeOptions = standardPageSizeOptions;

/**
 * 정렬·페이지 크기가 달라지면 기존 페이지 위치를 유지하지 않고 첫 페이지로 돌아간다.
 */
export function changeManagerView(
  search: ManagerSearch,
  patch: Partial<ManagerSearch>,
): ManagerSearch {
  return { ...search, ...patch, page: 1 };
}

export function changeManagerPageSize(
  search: ManagerSearch,
  pageSize: number,
): ManagerSearch {
  return changeManagerView(search, { pageSize });
}

/**
 * 이미 정렬 중인 컬럼은 방향을 반전하고 다른 컬럼은 현재 방향을 유지한다.
 * 헤더와 정렬 선택이 같은 전이 함수를 사용해 동작 차이가 생기지 않게 한다.
 */
export function selectManagerSort(
  search: ManagerSearch,
  sortType: ManagerSearch["sortType"],
): ManagerSearch {
  return sortType === search.sortType
    ? toggleManagerSortDirection(search)
    : changeManagerView(search, { sortType });
}

export function toggleManagerSortDirection(
  search: ManagerSearch,
): ManagerSearch {
  return changeManagerView(search, {
    sortDirection: search.sortDirection === "ASC" ? "DESC" : "ASC",
  });
}

/**
 * 페이지 이동은 지정한 페이지를 유지하고 나머지 확정 조건을 보존한다.
 */
export function goToManagerPage(
  search: ManagerSearch,
  page: number,
): ManagerSearch {
  return { ...search, page };
}
