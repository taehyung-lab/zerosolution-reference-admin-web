import { describe, expect, it } from 'vitest';
import { bannerListSearch, toBannerListRequest } from './banner-list-search';

const keys = [
  'page',
  'pageSize',
  'sortType',
  'sortDirection',
  'periodType',
  'startDateTime',
  'endDateTime',
  'keywords',
  'categories',
  'linkTypes',
  'statuses',
].sort();

describe('banner list search contract', () => {
  it('declares the same keys in schema, defaults and partition', () => {
    expect(Object.keys(bannerListSearch.schema.shape).sort()).toEqual(keys);
    expect(Object.keys(bannerListSearch.defaults).sort()).toEqual(keys);
    expect(Object.keys(bannerListSearch.partition).sort()).toEqual(keys);
  });

  it('keeps sort, page and view fields out of the filter draft identity', () => {
    for (const key of ['page', 'pageSize', 'sortType', 'sortDirection'] as const) {
      expect(bannerListSearch.partition[key]).toBe('view');
    }
    for (const key of ['periodType', 'keywords', 'categories', 'linkTypes', 'statuses'] as const) {
      expect(bannerListSearch.partition[key]).toBe('filter');
    }
  });

  // 기본값의 근거는 Case 정의 frame 과 Notion 의 default 문장이다(BANNER-LIST fact).
  it('resolves the ledger defaults for an empty URL', () => {
    const resolved = bannerListSearch.resolve({});
    expect(resolved.page).toBe(1);
    expect(resolved.pageSize).toBe(100);
    expect(resolved.sortType).toBe('registeredAt');
    expect(resolved.sortDirection).toBe('desc');
    expect(resolved.periodType).toBe('registeredAt');
    expect(resolved.keywords).toEqual([]);
    expect(resolved.categories).toEqual(['HOME']);
    expect(resolved.linkTypes).toEqual([]);
    expect(resolved.statuses).toEqual([]);
  });

  it('recovers invalid values without erasing unrelated valid conditions', () => {
    const parsed = bannerListSearch.schema.parse({
      page: 'not-a-number',
      sortType: 'unknown',
      periodType: 'nope',
      linkTypes: ['APP', 'NOPE'],
      statuses: ['POSTING', 'STOPPED'],
      keywords: [{ field: 'name', value: 'Reference' }],
    });
    expect(parsed.page).toBeUndefined();
    expect(parsed.sortType).toBeUndefined();
    expect(parsed.periodType).toBeUndefined();
    expect(parsed.linkTypes).toEqual(['APP']);
    expect(parsed.statuses).toEqual(['POSTING']);
    expect(parsed.keywords).toEqual([{ field: 'name', value: 'Reference' }]);
  });

  it('omits declared defaults and empty arrays from the canonical URL', () => {
    expect(
      bannerListSearch.canonical.parse({
        page: 1,
        pageSize: 100,
        sortType: 'registeredAt',
        sortDirection: 'desc',
        periodType: 'registeredAt',
        categories: ['HOME'],
        linkTypes: [],
        statuses: ['WAITING'],
      }),
    ).toEqual({ statuses: ['WAITING'] });
  });

  it('maps the resolved search to the request input, omitting empty filters', () => {
    expect(toBannerListRequest(bannerListSearch.resolve({ linkTypes: ['EXTERNAL'] }))).toEqual({
      page: 1,
      pageSize: 100,
      sortType: 'registeredAt',
      sortDirection: 'desc',
      periodType: 'registeredAt',
      startDateTime: undefined,
      endDateTime: undefined,
      keywords: undefined,
      categories: ['HOME'],
      linkTypes: ['EXTERNAL'],
      statuses: undefined,
    });
  });
});
