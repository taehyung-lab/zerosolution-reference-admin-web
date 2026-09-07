import { act, renderHook } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import { managerSortTypes, sortTypeOfColumn, type ManagerColumnId } from './manager-sort';
import { managerSearchDefaults } from './search-schema';
import { useManagerListResult } from './useManagerListResult';
import type { ManagerListData } from './useManagerListData';

const baseData: ManagerListData = {
  rows: [],
  total: 0,
  totalPages: 1,
  searched: true,
  isPending: false,
  isFetching: false,
  isError: false,
  retry: vi.fn(),
};

function wrapper({ children }: { readonly children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('useManagerListResult', () => {
  it('owns page size, sort, header direction toggle, and page route transitions', () => {
    const onSearchChange = vi.fn();
    const { result } = renderHook(
      () =>
        useManagerListResult({
          search: { ...managerSearchDefaults, page: 3 },
          data: { ...baseData, total: 250, totalPages: 3 },
          onSearchChange,
        }),
      { wrapper },
    );

    act(() => result.current.pageSize.onValueChange(200));
    expect(onSearchChange).toHaveBeenLastCalledWith(expect.objectContaining({ pageSize: 200 }));
    expect(onSearchChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('page');

    act(() => result.current.sort.onValueChange('UPDATED_AT'));
    expect(onSearchChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortType: 'UPDATED_AT' }),
    );
    // 정렬 전이는 같은 update 에서 page 를 되돌린다. 3페이지의 정렬 결과를 3페이지에 남기지 않는다.
    expect(onSearchChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('page');

    // 방향 전환 UI 는 toolbar 에 없다. 이미 정렬된 컬럼을 다시 선택하면 방향만 뒤집힌다.
    act(() => result.current.sort.onValueChange('CREATED_AT'));
    expect(onSearchChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortDirection: 'ASC' }),
    );
    // 기본 정렬 필드는 sparse URL 에서 생략된다.
    expect(onSearchChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('sortType');
    expect(onSearchChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('page');
    act(() => result.current.pagination?.onPageChange(2));
    expect(onSearchChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('always returns the pagination model and leaves single-page visibility to Pagination', () => {
    const { result } = renderHook(
      () =>
        useManagerListResult({
          search: managerSearchDefaults,
          data: baseData,
          onSearchChange: vi.fn(),
        }),
      { wrapper },
    );

    expect(result.current.pagination).toMatchObject({ page: 1, totalPages: 1 });
  });
});

describe('useManagerListResult sort vocabulary', () => {
  it('derives the sort options and the sortable headers from the same exposed sort set', () => {
    const { result } = renderHook(
      () =>
        useManagerListResult({
          search: managerSearchDefaults,
          data: baseData,
          onSearchChange: vi.fn(),
        }),
      { wrapper },
    );

    expect(result.current.sort.options.map((option) => option.value)).toEqual([
      ...managerSortTypes,
    ]);
    const sortableHeaderTypes = result.current.columns
      .filter((column) => column.meta?.sort !== undefined)
      .map((column) => sortTypeOfColumn(column.id as ManagerColumnId));
    expect(new Set(sortableHeaderTypes)).toEqual(new Set(managerSortTypes));
  });
});
