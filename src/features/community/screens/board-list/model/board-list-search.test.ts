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
  'sort',
  'sortDirection',
  'periodType',
  'startDateTime',
  'endDateTime',
  'names',
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
    expect(boardListSearchContract.partition.sort).toBe('view');
    expect(boardListSearchContract.partition.sortDirection).toBe('view');
    expect(boardListSearchContract.partition.periodType).toBe('filter');
    expect(boardListSearchContract.partition.names).toBe('filter');
  });

  it('resolves the ledger defaults for an empty URL', () => {
    const resolved = resolveBoardListSearch({});
    expect(resolved.page).toBe(1);
    expect(resolved.pageSize).toBe(100);
    expect(resolved.sort).toBe('registeredAt');
    expect(resolved.sortDirection).toBeUndefined();
    expect(resolved.periodType).toBe('registeredAt');
    expect(resolved.names).toEqual([]);
  });

  it('recovers invalid values without erasing unrelated valid conditions', () => {
    const parsed = boardListSearchContract.schema.parse({
      page: 'not-a-number',
      sort: 'unknown',
      categories: ['COUNSEL', 'NOPE'],
      writePermission: '',
      names: ['공지'],
    });
    expect(parsed.page).toBeUndefined();
    expect(parsed.sort).toBeUndefined();
    expect(parsed.categories).toEqual(['COUNSEL']);
    expect(parsed.writePermission).toBeUndefined();
    expect(parsed.names).toEqual(['공지']);
  });

  it('omits declared defaults and empty arrays from the canonical URL', () => {
    expect(
      boardListCanonicalSchema.parse({
        page: 1,
        pageSize: 100,
        sort: 'registeredAt',
        periodType: 'registeredAt',
        categories: [],
        names: ['공지'],
      }),
    ).toEqual({ names: ['공지'] });
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
      sort: 'registeredAt',
      sortDirection: undefined,
      periodType: 'registeredAt',
      startDateTime: undefined,
      endDateTime: undefined,
      names: undefined,
      types: undefined,
      categories: ['COUNSEL'],
      usages: undefined,
      writePermission: undefined,
      readPermission: undefined,
    });
  });
});
