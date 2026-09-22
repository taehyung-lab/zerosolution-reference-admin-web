import { describe, expect, it } from 'vitest';
import { termsListSearch, toTermsListRequest } from './terms-list-search';

const keys = [
  'page',
  'pageSize',
  'sortType',
  'sortDirection',
  'periodType',
  'startDateTime',
  'endDateTime',
  'keywords',
  'statuses',
].sort();

describe('terms list search contract', () => {
  it('declares the same keys in schema, defaults and partition', () => {
    expect(Object.keys(termsListSearch.schema.shape).sort()).toEqual(keys);
    expect(Object.keys(termsListSearch.defaults).sort()).toEqual(keys);
    expect(Object.keys(termsListSearch.partition).sort()).toEqual(keys);
  });

  it('keeps sort, page and view fields out of the filter draft identity', () => {
    expect(termsListSearch.partition.page).toBe('view');
    expect(termsListSearch.partition.pageSize).toBe('view');
    expect(termsListSearch.partition.sortType).toBe('view');
    expect(termsListSearch.partition.sortDirection).toBe('view');
    expect(termsListSearch.partition.periodType).toBe('filter');
    expect(termsListSearch.partition.keywords).toBe('filter');
    expect(termsListSearch.partition.statuses).toBe('filter');
  });

  // 기본값의 근거는 Case 정의 frame 과 Notion 의 default 문장이다(TERMS-LIST fact).
  it('resolves the ledger defaults for an empty URL', () => {
    const resolved = termsListSearch.resolve({});
    expect(resolved.page).toBe(1);
    expect(resolved.pageSize).toBe(100);
    expect(resolved.sortType).toBe('registeredAt');
    expect(resolved.sortDirection).toBe('desc');
    expect(resolved.periodType).toBe('registeredAt');
    expect(resolved.keywords).toEqual([]);
    expect(resolved.statuses).toEqual([]);
  });

  it('recovers invalid values without erasing unrelated valid conditions', () => {
    const parsed = termsListSearch.schema.parse({
      page: 'not-a-number',
      sortType: 'unknown',
      periodType: 'nope',
      statuses: ['PUBLISHED', 'NOPE'],
      keywords: [{ field: 'body', value: 'Reference' }],
    });
    expect(parsed.page).toBeUndefined();
    expect(parsed.sortType).toBeUndefined();
    expect(parsed.periodType).toBeUndefined();
    expect(parsed.statuses).toEqual(['PUBLISHED']);
    expect(parsed.keywords).toEqual([{ field: 'body', value: 'Reference' }]);
  });

  // 축을 가진 keywords 는 형제 목록과 같은 정책을 쓴다: 항목 하나가 깨지면 배열 전체를 버린다.
  it('drops the whole keyword array when an item is malformed, keeping other conditions', () => {
    const parsed = termsListSearch.schema.parse({
      keywords: [{ field: 'body', value: 'Reference' }, { field: 'nope', value: 'x' }],
      statuses: ['UNPUBLISHED'],
    });
    expect(parsed.keywords).toBeUndefined();
    expect(parsed.statuses).toEqual(['UNPUBLISHED']);
  });

  it('omits declared defaults and empty arrays from the canonical URL', () => {
    expect(
      termsListSearch.canonical.parse({
        page: 1,
        pageSize: 100,
        sortType: 'registeredAt',
        sortDirection: 'desc',
        periodType: 'registeredAt',
        statuses: [],
        keywords: [{ field: 'content', value: 'Reference' }],
      }),
    ).toEqual({ keywords: [{ field: 'content', value: 'Reference' }] });
  });

  it('drops a period with only one bound at the committed boundary', () => {
    expect(termsListSearch.canonical.parse({ startDateTime: '2026-01-01T00:00:00.000Z' })).toEqual({});
  });

  it('maps the resolved search to the request input, omitting empty filters', () => {
    expect(toTermsListRequest(termsListSearch.resolve({ statuses: ['PUBLISHED'] }))).toEqual({
      page: 1,
      pageSize: 100,
      sortType: 'registeredAt',
      sortDirection: 'desc',
      periodType: 'registeredAt',
      startDateTime: undefined,
      endDateTime: undefined,
      keywords: undefined,
      statuses: ['PUBLISHED'],
    });
  });
});
