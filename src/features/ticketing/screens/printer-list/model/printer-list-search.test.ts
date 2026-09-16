import { describe, expect, it } from 'vitest';
import { printerListSearch, toPrinterListRequest } from './printer-list-search';

const fieldNames = [
  'page',
  'pageSize',
  'sortType',
  'sortDirection',
  'periodType',
  'startDateTime',
  'endDateTime',
  'keywords',
  'statuses',
  'purposes',
  'usages',
].sort();

describe('스마트프린터 목록 검색 계약', () => {
  it('schema·defaults·partition 이 같은 키 집합을 선언한다', () => {
    expect(Object.keys(printerListSearch.schema.shape).sort()).toEqual(fieldNames);
    expect(Object.keys(printerListSearch.defaults).sort()).toEqual(fieldNames);
    expect(Object.keys(printerListSearch.partition).sort()).toEqual(fieldNames);
  });

  it('보기 100 · 정렬 등록일 desc · 기간 기준 등록일 · 빈 다중선택이 기본값이다', () => {
    expect(printerListSearch.defaults).toEqual({
      page: 1,
      pageSize: 100,
      sortType: 'registeredAt',
      sortDirection: 'desc',
      periodType: 'registeredAt',
      startDateTime: undefined,
      endDateTime: undefined,
      keywords: [],
      statuses: [],
      purposes: [],
      usages: [],
    });
  });

  it('빈 URL 은 기본값으로 해소되고 canonical URL 은 기본값과 빈 배열을 생략한다', () => {
    expect(printerListSearch.resolve({}).pageSize).toBe(100);
    expect(printerListSearch.canonical.parse({})).toEqual({});
    expect(printerListSearch.canonical.parse({ page: 1, pageSize: 200, statuses: [] })).toEqual({
      pageSize: 200,
    });
  });

  it('잘못된 값은 기본값으로 복구하고 인식할 수 없는 배열 항목만 버린다', () => {
    const recovered = printerListSearch.schema.parse({
      page: 'wrong',
      sortType: 'nothing',
      statuses: ['NORMAL', 'UNKNOWN'],
    });
    expect(recovered.page).toBeUndefined();
    expect(recovered.sortType).toBeUndefined();
    expect(recovered.statuses).toEqual(['NORMAL']);
  });

  it('한쪽만 있는 기간은 canonical 에서 함께 사라지고 나머지 조건은 남는다', () => {
    expect(
      printerListSearch.canonical.parse({
        startDateTime: '2026-01-01T00:00:00.000Z',
        usages: ['IN_USE'],
      }),
    ).toEqual({ usages: ['IN_USE'] });
  });

  it('요청 입력은 빈 배열을 생략하고 선택한 조건만 싣는다', () => {
    expect(toPrinterListRequest(printerListSearch.resolve({ statuses: ['BROKEN'], page: 2 }))).toEqual({
      page: 2,
      pageSize: 100,
      sortType: 'registeredAt',
      sortDirection: 'desc',
      periodType: 'registeredAt',
      startDateTime: undefined,
      endDateTime: undefined,
      keywords: undefined,
      statuses: ['BROKEN'],
      purposes: undefined,
      usages: undefined,
    });
  });
});
