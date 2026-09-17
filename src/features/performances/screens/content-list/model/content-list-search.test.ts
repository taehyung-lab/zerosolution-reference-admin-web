import { describe, expect, it } from 'vitest';
import { contentListQueryOptions } from '@/features/performances/api/queries';
import { contentListSearch, toContentListRequest } from './content-list-search';

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
  'usageStatuses',
  'venueId',
].sort();

describe('콘텐츠 목록 검색 계약', () => {
  it('schema·defaults·partition 이 같은 키 집합을 선언한다', () => {
    expect(Object.keys(contentListSearch.schema.shape).sort()).toEqual(keys);
    expect(Object.keys(contentListSearch.defaults).sort()).toEqual(keys);
    expect(Object.keys(contentListSearch.partition).sort()).toEqual(keys);
  });

  it('빈 URL 은 기본값(보기 100 · 정렬 등록일 desc · 기간 기준 공연일)으로 해소되고 canonical 은 기본값을 생략한다', () => {
    expect(contentListSearch.resolve({})).toMatchObject({
      page: 1,
      pageSize: 100,
      sortType: 'registeredAt',
      sortDirection: 'desc',
      periodType: 'performedAt',
      keywords: [],
      usageStatuses: [],
      venueId: undefined,
    });
    expect(contentListSearch.canonical.parse(contentListSearch.defaults)).toEqual({});
  });

  it('진입 즉시 조회라 검색 표식을 URL 에 두지 않는다', () => {
    expect(Object.keys(contentListSearch.schema.shape)).not.toContain('searched');
    expect(contentListSearch.canonical.parse({ page: 2 })).toEqual({ page: 2 });
  });

  it('명시한 조건은 해소와 canonical 을 오가도 그대로다', () => {
    const input = {
      periodType: 'updatedAt',
      startDateTime: '2026-09-01T00:00:00Z',
      endDateTime: '2026-09-07T00:00:00Z',
      keywords: [{ field: 'performers', value: 'Reference' }],
      ticketKinds: ['day'],
      performanceTypes: ['concert'],
      usageStatuses: ['inUse'],
      venueId: 'venue',
      sortType: 'usageStatus',
      sortDirection: 'asc',
      page: 2,
      pageSize: 200,
    } as const;
    const sparse = contentListSearch.canonical.parse(input);
    expect(sparse).toEqual(input);
    expect(contentListSearch.canonical.parse(contentListSearch.resolve(sparse))).toEqual(input);
  });

  it('깨진 배열 항목은 배열 전체를, 한쪽만 있는 기간은 기간을 지우고 공연장은 남긴다', () => {
    expect(
      contentListSearch.canonical.parse({
        keywords: [{ field: 'title', value: 'Reference' }, { field: 'bad', value: 'X' }],
        usageStatuses: ['inUse', 'unknown'],
        startDateTime: '2026-09-01T00:00:00Z',
        venueId: 'venue',
      }),
    ).toEqual({ usageStatuses: ['inUse'], venueId: 'venue' });
  });

  it('진입·초기화·명시 기본값이 같은 캐시 정체성을 갖고 다른 페이지는 다른 키다', () => {
    const entry = contentListQueryOptions('ko', toContentListRequest(contentListSearch.resolve({})));
    const explicit = contentListQueryOptions(
      'ko',
      toContentListRequest(contentListSearch.resolve({ page: 1, pageSize: 100 })),
    );
    expect(entry.queryKey).toEqual(explicit.queryKey);
    expect(
      contentListQueryOptions('ko', toContentListRequest(contentListSearch.resolve({ page: 2 }))).queryKey,
    ).not.toEqual(entry.queryKey);
  });
});
