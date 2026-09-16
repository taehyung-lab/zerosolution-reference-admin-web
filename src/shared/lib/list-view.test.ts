import { describe, expect, it, vi } from 'vitest';
import {
  changePageSize,
  changeSort,
  goToPage,
  listViewControls,
  toggleHeaderSort,
} from './list-view';

const view = {
  page: 3,
  pageSize: 100,
  sortType: 'createdAt' as 'createdAt' | 'name',
  sortDirection: 'desc' as const,
  status: 'open',
};

describe('list view transitions', () => {
  it('returns to the first page when page size or sort key changes and keeps other fields', () => {
    expect(changePageSize(view, 200)).toEqual({ ...view, pageSize: 200, page: 1 });
    expect(changeSort(view, 'name')).toEqual({ ...view, sortType: 'name', page: 1 });
  });

  it('keeps everything but the page on page moves', () => {
    expect(goToPage(view, 7)).toEqual({ ...view, page: 7 });
  });

  it('flips direction only on the active header and keeps it for another column', () => {
    expect(toggleHeaderSort(view, 'createdAt')).toEqual({
      ...view,
      sortDirection: 'asc',
      page: 1,
    });
    expect(toggleHeaderSort({ ...view, sortDirection: 'asc' }, 'createdAt').sortDirection).toBe(
      'desc',
    );
    expect(toggleHeaderSort(view, 'name')).toEqual({ ...view, sortType: 'name', page: 1 });
  });

  it('routes every control through the one commit callback', () => {
    const commit = vi.fn<(next: typeof view) => void>();
    const controls = listViewControls({ search: view, totalPages: 9, commit });

    controls.pageSize.onValueChange(300);
    controls.sort.onValueChange('name');
    controls.sort.onHeaderSort('createdAt');
    controls.pagination.onPageChange(2);

    expect(controls.pageSize.value).toBe(100);
    expect(controls.sort).toMatchObject({ value: 'createdAt', direction: 'desc' });
    expect(controls.pagination).toMatchObject({ page: 3, totalPages: 9 });
    expect(commit.mock.calls.map(([next]) => next)).toEqual([
      { ...view, pageSize: 300, page: 1 },
      { ...view, sortType: 'name', page: 1 },
      { ...view, sortDirection: 'asc', page: 1 },
      { ...view, page: 2 },
    ]);
  });
});
