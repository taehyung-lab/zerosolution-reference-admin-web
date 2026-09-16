import { describe, expect, it } from 'vitest';
import { performanceListQueryOptions } from '@/features/performances/api/queries';
import { performanceListSearch, toPerformanceListRequest } from './performance-list-search';

const keys = [
  'page',
  'pageSize',
  'sortType',
  'sortDirection',
  'periodType',
  'startDateTime',
  'endDateTime',
  'keywords',
  'ticketKinds',
  'performanceTypes',
  'sellers',
  'venueId',
].sort();

describe('공연 목록 검색 계약', () => {
  it('schema·defaults·partition 이 같은 키 집합을 선언한다', () => {
    expect(Object.keys(performanceListSearch.schema.shape).sort()).toEqual(keys);
    expect(Object.keys(performanceListSearch.defaults).sort()).toEqual(keys);
    expect(Object.keys(performanceListSearch.partition).sort()).toEqual(keys);
  });

  it('빈 URL 은 기본값(보기 100 · 정렬 등록일 desc · 기간 기준 공연일)으로 해소되고 canonical 은 기본값을 생략한다', () => {
    expect(performanceListSearch.resolve({})).toMatchObject({
      page: 1,
      pageSize: 100,
      sortType: 'registeredAt',
      sortDirection: 'desc',
      periodType: 'performedAt',
      keywords: [],
      venueId: undefined,
    });
    expect(performanceListSearch.canonical.parse(performanceListSearch.defaults)).toEqual({});
  });

  it('명시한 조건은 해소와 canonical 을 오가도 그대로다', () => {
    const input = {
      periodType: 'updatedAt',
      startDateTime: '2026-09-01T00:00:00Z',
      endDateTime: '2026-09-07T00:00:00Z',
      keywords: [{ field: 'title', value: 'Concert' }],
      ticketKinds: ['paid'],
      performanceTypes: ['live'],
      sellers: ['seller'],
      venueId: 'venue',
      sortType: 'title',
      sortDirection: 'asc',
      page: 2,
      pageSize: 200,
    } as const;
    const sparse = performanceListSearch.canonical.parse(input);
    expect(sparse).toEqual(input);
    expect(performanceListSearch.canonical.parse(performanceListSearch.resolve(sparse))).toEqual(input);
  });

  it('깨진 배열 항목은 배열 전체를, 한쪽만 있는 기간은 기간을 지우고 공연장은 남긴다', () => {
    expect(
      performanceListSearch.canonical.parse({
        keywords: [{ field: 'title', value: 'Concert' }, { field: 'bad', value: 'X' }],
        ticketKinds: ['paid', null],
        startDateTime: '2026-09-01T00:00:00Z',
        venueId: 'venue',
      }),
    ).toEqual({ ticketKinds: ['paid'], venueId: 'venue' });
  });

  it('진입·초기화·명시 기본값이 같은 캐시 정체성을 갖고 다른 페이지는 다른 키다', () => {
    const entry = performanceListQueryOptions('ko', toPerformanceListRequest(performanceListSearch.resolve({})));
    const explicit = performanceListQueryOptions(
      'ko',
      toPerformanceListRequest(performanceListSearch.resolve({ page: 1, pageSize: 100 })),
    );
    expect(entry.queryKey).toEqual(explicit.queryKey);
    expect(JSON.stringify(entry.queryKey)).not.toContain('searched');
    expect(
      performanceListQueryOptions('ko', toPerformanceListRequest(performanceListSearch.resolve({ page: 2 }))).queryKey,
    ).not.toEqual(entry.queryKey);
  });
});
