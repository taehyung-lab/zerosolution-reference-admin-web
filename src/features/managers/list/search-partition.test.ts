import { describe, expect, it } from 'vitest';
import {
  filterPartitionKey,
  filterPartitionValues,
  type SearchFieldPartition,
} from './search-partition';

describe('search field partition', () => {
  interface PartitionedSearch {
    readonly keyword?: string;
    readonly statuses?: readonly string[];
    readonly page?: number;
    readonly sortType?: string;
  }
  const partition = {
    keyword: 'filter',
    statuses: 'filter',
    page: 'view',
    sortType: 'view',
  } as const satisfies SearchFieldPartition<PartitionedSearch>;

  it('ignores view fields in the filter identity', () => {
    const base: PartitionedSearch = { keyword: 'a', page: 1, sortType: 'NAME' };
    const paged: PartitionedSearch = { keyword: 'a', page: 7, sortType: 'ID' };
    expect(filterPartitionKey(base, partition)).toBe(
      filterPartitionKey(paged, partition),
    );
  });

  it('changes the filter identity when a filter field changes', () => {
    const base: PartitionedSearch = { keyword: 'a' };
    const other: PartitionedSearch = { keyword: 'b' };
    expect(filterPartitionKey(base, partition)).not.toBe(
      filterPartitionKey(other, partition),
    );
  });

  it('treats an added filter field as part of the identity', () => {
    const base: PartitionedSearch = { keyword: 'a' };
    const withStatus: PartitionedSearch = { keyword: 'a', statuses: ['ACTIVE'] };
    expect(filterPartitionKey(base, partition)).not.toBe(
      filterPartitionKey(withStatus, partition),
    );
  });

  it('is stable regardless of key insertion order', () => {
    const first = { keyword: 'a', statuses: ['ACTIVE'] } as PartitionedSearch;
    const second = { statuses: ['ACTIVE'], keyword: 'a' } as PartitionedSearch;
    expect(filterPartitionKey(first, partition)).toBe(
      filterPartitionKey(second, partition),
    );
  });

  it('keeps only the filter half of a search', () => {
    const search: PartitionedSearch = {
      keyword: 'a',
      statuses: ['ACTIVE'],
      page: 4,
      sortType: 'ID',
    };
    expect(filterPartitionValues(search, partition)).toEqual({
      keyword: 'a',
      statuses: ['ACTIVE'],
    });
  });
});
