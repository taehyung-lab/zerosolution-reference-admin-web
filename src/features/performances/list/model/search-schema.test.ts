import { describe, expect, it } from 'vitest';
import { performanceSearchSchema, resolvePerformanceSearch } from './search-schema';

describe('performance search defaults', () => {
  it('keeps entry and reset distinct while resolving the same view defaults', () => {
    const entry = resolvePerformanceSearch({});
    expect(entry).toMatchObject({ page: 1, pageSize: 100, sortType: 'registeredAt', periodType: 'performedAt', keywords: [] });
    expect(entry.searched).toBeUndefined();
    expect(entry.sortDirection).toBeUndefined();
    expect(entry.startDateTime).toBeUndefined();
    expect(entry.endDateTime).toBeUndefined();
    expect(resolvePerformanceSearch({ searched: false }).searched).toBe(false);
    expect(performanceSearchSchema.parse(entry)).toEqual({});
  });
  it('preserves explicit period, keywords, sort direction and paging through resolution', () => {
    const search = performanceSearchSchema.parse({ periodType: 'updatedAt', sortType: 'title', sortDirection: 'desc', page: 2, pageSize: 200, keywords: [{ field: 'title', value: 'Concert' }], startDateTime: '2026-09-01T00:00:00Z' });
    expect(resolvePerformanceSearch(search)).toMatchObject(search);
    expect(performanceSearchSchema.parse(resolvePerformanceSearch(search))).toEqual(search);
  });
});
