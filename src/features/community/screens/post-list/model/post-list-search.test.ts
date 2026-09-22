import { describe, expect, it } from 'vitest';
import { postListSearch, toPostListRequest } from './post-list-search';

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
  'boardId',
  'memberType',
  'answerStatuses',
  'statuses',
].sort();

describe('post list search contract', () => {
  it('declares the same keys in schema, defaults and partition', () => {
    expect(Object.keys(postListSearch.schema.shape).sort()).toEqual(keys);
    expect(Object.keys(postListSearch.defaults).sort()).toEqual(keys);
    expect(Object.keys(postListSearch.partition).sort()).toEqual(keys);
  });

  it('keeps sort, page and view fields out of the filter draft identity', () => {
    expect(postListSearch.partition.page).toBe('view');
    expect(postListSearch.partition.pageSize).toBe('view');
    expect(postListSearch.partition.sortType).toBe('view');
    expect(postListSearch.partition.sortDirection).toBe('view');
    expect(postListSearch.partition.periodType).toBe('filter');
    expect(postListSearch.partition.keywords).toBe('filter');
    expect(postListSearch.partition.boardId).toBe('filter');
  });

  it('resolves the observed defaults for an empty URL', () => {
    const resolved = postListSearch.resolve({});
    expect(resolved.page).toBe(1);
    expect(resolved.pageSize).toBe(100);
    expect(resolved.sortType).toBe('registeredAt');
    expect(resolved.sortDirection).toBe('desc');
    expect(resolved.periodType).toBe('registeredAt');
    expect(resolved.keywords).toEqual([]);
    expect(resolved.categories).toEqual([]);
    expect(resolved.answerStatuses).toEqual([]);
    expect(resolved.statuses).toEqual([]);
    expect(resolved.boardId).toBeUndefined();
    expect(resolved.memberType).toBeUndefined();
  });

  it('recovers invalid values without erasing unrelated valid conditions', () => {
    const parsed = postListSearch.schema.parse({
      page: 'not-a-number',
      sortType: 'unknown',
      answerStatuses: ['DONE', 'NOPE'],
      statuses: ['IN_USE'],
      memberType: '',
      boardId: '   ',
      keywords: [{ field: 'content', value: 'Reference' }],
    });
    expect(parsed.page).toBeUndefined();
    expect(parsed.sortType).toBeUndefined();
    expect(parsed.answerStatuses).toEqual(['DONE']);
    expect(parsed.statuses).toEqual(['IN_USE']);
    expect(parsed.memberType).toBeUndefined();
    expect(parsed.boardId).toBeUndefined();
    expect(parsed.keywords).toEqual([{ field: 'content', value: 'Reference' }]);
  });

  it('drops a half-open period and declared defaults from the committed URL', () => {
    expect(
      postListSearch.canonical.parse({
        page: 1,
        pageSize: 100,
        sortType: 'registeredAt',
        sortDirection: 'desc',
        periodType: 'registeredAt',
        startDateTime: '2026-09-01T00:00:00.000Z',
        categories: [],
        statuses: [],
      }),
    ).toEqual({});
  });

  it('keeps a closed period and non-default conditions in the committed URL', () => {
    expect(
      postListSearch.canonical.parse({
        page: 2,
        pageSize: 200,
        sortType: 'viewCount',
        sortDirection: 'asc',
        periodType: 'updatedAt',
        startDateTime: '2026-09-01T00:00:00.000Z',
        endDateTime: '2026-09-30T00:00:00.000Z',
        boardId: 'reference-board-1',
        memberType: 'MANAGER',
        answerStatuses: ['PENDING'],
      }),
    ).toEqual({
      page: 2,
      pageSize: 200,
      sortType: 'viewCount',
      sortDirection: 'asc',
      periodType: 'updatedAt',
      startDateTime: '2026-09-01T00:00:00.000Z',
      endDateTime: '2026-09-30T00:00:00.000Z',
      boardId: 'reference-board-1',
      memberType: 'MANAGER',
      answerStatuses: ['PENDING'],
    });
  });

  it('omits empty arrays and unset single-choice filters from the request input', () => {
    const request = toPostListRequest(postListSearch.resolve({}));
    expect(request).toEqual({
      page: 1,
      pageSize: 100,
      sortType: 'registeredAt',
      sortDirection: 'desc',
      periodType: 'registeredAt',
      startDateTime: undefined,
      endDateTime: undefined,
      keywords: undefined,
      categories: undefined,
      boardId: undefined,
      memberType: undefined,
      answerStatuses: undefined,
      statuses: undefined,
    });
  });
});
