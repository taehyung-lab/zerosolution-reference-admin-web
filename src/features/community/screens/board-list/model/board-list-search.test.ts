import { describe, expect, it } from 'vitest';
import {
  boardListCanonicalSchema,
  boardListSearchContract,
  resolveBoardListSearch,
  toBoardListRequest,
} from './board-list-search';

const keys = [
  'page',
  'pageSize',
  'sortType',
  'sortDirection',
  'periodType',
  'startDateTime',
  'endDateTime',
  'keywords',
  'types',
  'categories',
  'usages',
  'writePermission',
  'readPermission',
];

describe('board list search contract', () => {
  it('declares the same keys in schema, defaults and partition', () => {
    expect(Object.keys(boardListSearchContract.schema.shape).sort()).toEqual([...keys].sort());
    expect(Object.keys(boardListSearchContract.defaults).sort()).toEqual([...keys].sort());
    expect(Object.keys(boardListSearchContract.partition).sort()).toEqual([...keys].sort());
  });

  it('keeps sort, page and view fields out of the filter draft identity', () => {
    expect(boardListSearchContract.partition.page).toBe('view');
    expect(boardListSearchContract.partition.pageSize).toBe('view');
    expect(boardListSearchContract.partition.sortType).toBe('view');
    expect(boardListSearchContract.partition.sortDirection).toBe('view');
    expect(boardListSearchContract.partition.periodType).toBe('filter');
    expect(boardListSearchContract.partition.keywords).toBe('filter');
  });

  it('resolves the ledger defaults for an empty URL', () => {
    const resolved = resolveBoardListSearch({});
    expect(resolved.page).toBe(1);
    expect(resolved.pageSize).toBe(100);
    expect(resolved.sortType).toBe('registeredAt');
    expect(resolved.sortDirection).toBe('desc');
    expect(resolved.periodType).toBe('registeredAt');
    expect(resolved.keywords).toEqual([]);
  });

  it('recovers invalid values without erasing unrelated valid conditions', () => {
    const parsed = boardListSearchContract.schema.parse({
      page: 'not-a-number',
      sortType: 'unknown',
      categories: ['COUNSEL', 'NOPE'],
      writePermission: '',
      keywords: [{ field: 'name', value: 'Reference' }],
    });
    expect(parsed.page).toBeUndefined();
    expect(parsed.sortType).toBeUndefined();
    expect(parsed.categories).toEqual(['COUNSEL']);
    expect(parsed.writePermission).toBeUndefined();
    expect(parsed.keywords).toEqual([{ field: 'name', value: 'Reference' }]);
  });

  // 축을 가진 keywords 는 형제 목록과 같은 정책을 쓴다: 항목 하나가 깨지면 배열 전체를 버리고
  // 다른 유효 조건은 남긴다(대상 enum 이 맞지 않는 항목만 지우면 무엇을 검색했는지 달라진다).
  it('drops the whole keyword array when an item is malformed, keeping other conditions', () => {
    const parsed = boardListSearchContract.schema.parse({
      keywords: [{ field: 'name', value: 'Reference' }, { field: 'title', value: 'x' }],
      categories: ['COUNSEL'],
    });
    expect(parsed.keywords).toBeUndefined();
    expect(parsed.categories).toEqual(['COUNSEL']);
  });

  it('omits declared defaults and empty arrays from the canonical URL', () => {
    expect(
      boardListCanonicalSchema.parse({
        page: 1,
        pageSize: 100,
        sortType: 'registeredAt',
        periodType: 'registeredAt',
        categories: [],
        keywords: [{ field: 'name', value: 'Reference' }],
      }),
    ).toEqual({ keywords: [{ field: 'name', value: 'Reference' }] });
  });

  it('drops a period with only one bound at the committed boundary', () => {
    expect(
      boardListCanonicalSchema.parse({ startDateTime: '2026-01-01T00:00:00.000Z' }),
    ).toEqual({});
  });

  it('maps the resolved search to the request input, omitting empty filters', () => {
    expect(toBoardListRequest(resolveBoardListSearch({ categories: ['COUNSEL'] }))).toEqual({
      page: 1,
      pageSize: 100,
      sortType: 'registeredAt',
      sortDirection: 'desc',
      periodType: 'registeredAt',
      startDateTime: undefined,
      endDateTime: undefined,
      keywords: undefined,
      types: undefined,
      categories: ['COUNSEL'],
      usages: undefined,
      writePermission: undefined,
      readPermission: undefined,
    });
  });
});
