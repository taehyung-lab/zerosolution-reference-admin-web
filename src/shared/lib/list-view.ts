/**
 * The view part of every paged list URL: page, page size, sort key, sort direction.
 * Transitions are pure and shared because they carry no domain fact:
 *
 * - changing page size or sort key returns to the first page;
 * - moving between pages keeps everything else;
 * - only the active column header flips the direction. Choosing another key, from the
 *   sort select or another header, keeps the current direction.
 */
export type SortDirection = 'asc' | 'desc';

export interface ListViewSearch<TSort extends string> {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: TSort;
  readonly sortDirection: SortDirection;
}

export function changePageSize<T extends ListViewSearch<string>>(search: T, pageSize: number): T {
  return { ...search, pageSize, page: 1 };
}

export function changeSort<T extends ListViewSearch<string>>(search: T, sortType: T['sortType']): T {
  return { ...search, sortType, page: 1 };
}

export function toggleHeaderSort<T extends ListViewSearch<string>>(
  search: T,
  sortType: T['sortType'],
): T {
  const active = search.sortType === sortType;
  const sortDirection: SortDirection =
    active && search.sortDirection === 'asc' ? 'desc' : active ? 'asc' : search.sortDirection;
  return { ...search, sortType, sortDirection, page: 1 };
}

export function goToPage<T extends ListViewSearch<string>>(search: T, page: number): T {
  return { ...search, page };
}

export interface ListViewControls<T extends ListViewSearch<string>> {
  readonly pageSize: {
    readonly value: number;
    readonly onValueChange: (pageSize: number) => void;
  };
  readonly sort: {
    readonly value: T['sortType'];
    readonly direction: SortDirection;
    readonly onValueChange: (sortType: T['sortType']) => void;
    readonly onHeaderSort: (sortType: T['sortType']) => void;
  };
  readonly pagination: {
    readonly page: number;
    readonly totalPages: number;
    readonly onPageChange: (page: number) => void;
  };
}

/**
 * What the result toolbar and pager render for one committed view. `commit` is the list's
 * only way out to the URL; the caller decides how a full search becomes a sparse one.
 */
export function listViewControls<T extends ListViewSearch<string>>({
  search,
  totalPages,
  commit,
}: {
  readonly search: T;
  readonly totalPages: number;
  readonly commit: (next: T) => void;
}): ListViewControls<T> {
  return {
    pageSize: {
      value: search.pageSize,
      onValueChange: (pageSize: number) => commit(changePageSize(search, pageSize)),
    },
    sort: {
      value: search.sortType,
      direction: search.sortDirection,
      onValueChange: (sortType: T['sortType']) => commit(changeSort(search, sortType)),
      onHeaderSort: (sortType: T['sortType']) => commit(toggleHeaderSort(search, sortType)),
    },
    pagination: {
      page: search.page,
      totalPages,
      onPageChange: (page: number) => commit(goToPage(search, page)),
    },
  };
}
