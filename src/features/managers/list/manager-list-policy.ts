import { standardPageSizeOptions } from '@/shared/config/list';
import type { ManagerSearch } from './search-schema';

export const managerPageSizeOptions = standardPageSizeOptions;

/**
 * Every view transition except paging returns to the first page, because the current page
 * number is meaningless against a different sort or page size (§list-workflow).
 */
export function changeManagerView(
  search: ManagerSearch,
  patch: Partial<ManagerSearch>,
): ManagerSearch {
  return { ...search, ...patch, page: 1 };
}

export function changeManagerPageSize(search: ManagerSearch, pageSize: number): ManagerSearch {
  return changeManagerView(search, { pageSize });
}

/**
 * Choosing the column that is already sorted toggles its direction; any other column keeps the
 * current direction. Both the column header and the sort control go through here so the two
 * entry points cannot drift apart.
 */
export function selectManagerSort(
  search: ManagerSearch,
  sortType: ManagerSearch['sortType'],
): ManagerSearch {
  return sortType === search.sortType
    ? toggleManagerSortDirection(search)
    : changeManagerView(search, { sortType });
}

export function toggleManagerSortDirection(search: ManagerSearch): ManagerSearch {
  return changeManagerView(search, {
    sortDirection: search.sortDirection === 'ASC' ? 'DESC' : 'ASC',
  });
}

/** Paging is the one view transition that keeps its own value. */
export function goToManagerPage(search: ManagerSearch, page: number): ManagerSearch {
  return { ...search, page };
}
