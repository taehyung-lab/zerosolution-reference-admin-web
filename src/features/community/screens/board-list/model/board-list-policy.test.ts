import { describe, expect, it } from 'vitest';
import {
  toHeaderSortSearch,
  toPageSearch,
  toPageSizeSearch,
  toSortSearch,
  toSubmittedSearch,
} from './board-list-policy';
import { resolveBoardListSearch } from './board-list-search';

const search = resolveBoardListSearch({ page: 3, categories: ['COUNSEL'] });

describe('board list URL policy', () => {
  it('returns to the first page when the view size changes', () => {
    const next = toPageSizeSearch(search, 200);
    expect(next.page).toBeUndefined();
    expect(next.pageSize).toBe(200);
    expect(next.categories).toEqual(['COUNSEL']);
  });

  it('returns to the first page when the sort field changes and keeps the direction', () => {
    const next = toSortSearch({ ...search, sortDirection: 'desc' }, 'name');
    expect(next.page).toBeUndefined();
    expect(next.sortType).toBe('name');
    expect(next.sortDirection).toBe('desc');
  });

  it('preserves the committed conditions when only the page moves', () => {
    const next = toPageSearch(search, 5);
    expect(next.page).toBe(5);
    expect(next.categories).toEqual(['COUNSEL']);
    expect(next.sortType).toBeUndefined();
  });

  it('flips the active header and starts another column ascending', () => {
    const first = toHeaderSortSearch(search, 'registeredAt');
    expect(first.sortDirection).toBe('asc');

    const flipped = toHeaderSortSearch({ ...search, sortDirection: 'asc' }, 'registeredAt');
    expect(flipped.sortDirection).toBe('desc');

    const other = toHeaderSortSearch({ ...search, sortDirection: 'desc' }, 'postCount');
    expect(other.sortType).toBe('postCount');
    expect(other.sortDirection).toBe('asc');
  });

  it('commits submitted inputs as a canonical first page', () => {
    const next = toSubmittedSearch(search, {
      filters: { periodType: 'updatedAt', categories: [] },
      range: {},
      keywords: [{ field: 'name', value: 'Reference' }],
    });
    expect(next).toEqual({
      periodType: 'updatedAt',
      keywords: [{ field: 'name', value: 'Reference' }],
    });
  });
});
