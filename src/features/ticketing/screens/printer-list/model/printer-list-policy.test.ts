import { describe, expect, it } from 'vitest';
import {
  toHeaderSortSearch,
  toPageSearch,
  toPageSizeSearch,
  toSortSearch,
  toSubmittedSearch,
} from './printer-list-policy';
import { resolvePrinterListSearch } from './printer-list-search';

const base = resolvePrinterListSearch({});

describe('스마트프린터 목록 URL 전이', () => {
  it('보기·정렬 변경은 첫 페이지로 돌아간다', () => {
    const paged = resolvePrinterListSearch({ page: 3 });
    expect(toPageSizeSearch(paged, 200)).toEqual({ pageSize: 200 });
    expect(toSortSearch(paged, 'name')).toEqual({ sortType: 'name' });
  });

  it('정렬 select 는 방향을 유지하고 활성 헤더 클릭만 방향을 뒤집는다', () => {
    expect(toSortSearch(base, 'name')).toEqual({ sortType: 'name' });
    expect(toHeaderSortSearch(base, 'registeredAt')).toEqual({ sortDirection: 'asc' });
    expect(toHeaderSortSearch(resolvePrinterListSearch({ sortDirection: 'asc' }), 'registeredAt')).toEqual(
      {},
    );
  });

  it('다른 컬럼 헤더는 오름차순부터 시작한다', () => {
    expect(toHeaderSortSearch(base, 'serialNo')).toEqual({
      sortType: 'serialNo',
      sortDirection: 'asc',
    });
  });

  it('페이지 이동은 나머지 확정 조건을 보존한다', () => {
    const committed = resolvePrinterListSearch({ statuses: ['REPAIR'], pageSize: 200 });
    expect(toPageSearch(committed, 4)).toEqual({
      statuses: ['REPAIR'],
      pageSize: 200,
      page: 4,
    });
  });

  it('검색 제출은 필터·기간·검색어를 첫 페이지로 커밋하고 보기·정렬은 유지한다', () => {
    const committed = resolvePrinterListSearch({ page: 5, pageSize: 200, sortType: 'name' });
    expect(
      toSubmittedSearch(committed, {
        filters: { statuses: ['NORMAL'], purposes: [], usages: [], periodType: 'updatedAt' },
        range: { startDateTime: undefined, endDateTime: undefined },
        keywords: [{ field: 'serialNo', value: 'ZERO' }],
      }),
    ).toEqual({
      pageSize: 200,
      sortType: 'name',
      periodType: 'updatedAt',
      statuses: ['NORMAL'],
      keywords: [{ field: 'serialNo', value: 'ZERO' }],
    });
  });
});
