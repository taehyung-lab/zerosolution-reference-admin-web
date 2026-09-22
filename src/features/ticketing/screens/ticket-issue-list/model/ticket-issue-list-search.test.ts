import { describe, expect, it } from 'vitest';
import { ticketIssueListSearch, toTicketIssueListRequest } from './ticket-issue-list-search';

const fieldNames = [
  'page',
  'pageSize',
  'sortType',
  'sortDirection',
  'periodType',
  'startDateTime',
  'endDateTime',
  'keywords',
  'performanceId',
  'scheduleId',
  'vendors',
  'reservationStatuses',
  'issueStatuses',
  'reissueStatuses',
].sort();

describe('전체발권 목록 검색 계약', () => {
  it('schema·defaults·partition 이 같은 키 집합을 선언한다 (searched 는 gate 표식)', () => {
    expect(Object.keys(ticketIssueListSearch.schema.shape).sort()).toEqual(
      [...fieldNames, 'searched'].sort(),
    );
    expect(Object.keys(ticketIssueListSearch.defaults).sort()).toEqual(fieldNames);
    expect(Object.keys(ticketIssueListSearch.partition).sort()).toEqual(fieldNames);
  });

  it('보기 100 · 정렬 등록일 desc · 기간 기준 예매일 · 빈 다중선택이 기본값이다', () => {
    expect(ticketIssueListSearch.defaults).toEqual({
      page: 1,
      pageSize: 100,
      sortType: 'registeredAt',
      sortDirection: 'desc',
      periodType: 'reservedAt',
      startDateTime: undefined,
      endDateTime: undefined,
      keywords: [],
      performanceId: undefined,
      scheduleId: undefined,
      vendors: [],
      reservationStatuses: [],
      issueStatuses: [],
      reissueStatuses: [],
    });
  });

  it('빈 URL 은 검색 전이고, 조건이 하나라도 있는 URL 은 canonical 이 검색됨으로 표시한다', () => {
    expect(ticketIssueListSearch.resolve({}).searched).toBe(false);
    expect(ticketIssueListSearch.resolve({ searched: true }).searched).toBe(true);
    expect(ticketIssueListSearch.canonical.parse({ vendors: ['YES24'] })).toEqual({
      vendors: ['YES24'],
      searched: true,
    });
    expect(ticketIssueListSearch.canonical.parse({ vendors: ['YES24'], searched: false })).toEqual({});
  });

  it('canonical URL 은 기본값과 빈 배열을 생략한다', () => {
    expect(ticketIssueListSearch.canonical.parse({})).toEqual({});
    expect(
      ticketIssueListSearch.canonical.parse({ page: 1, pageSize: 200, vendors: [], searched: true }),
    ).toEqual({ pageSize: 200, searched: true });
  });

  it('잘못된 값은 기본값으로 복구하고 인식할 수 없는 배열 항목만 버린다', () => {
    const recovered = ticketIssueListSearch.schema.parse({
      page: 'wrong',
      sortType: 'nothing',
      vendors: ['YES24', 'UNKNOWN'],
      reissueStatuses: ['REISSUE_CS_LOST', 'REISSUE_NOTHING'],
    });
    expect(recovered.page).toBeUndefined();
    expect(recovered.sortType).toBeUndefined();
    expect(recovered.vendors).toEqual(['YES24']);
    expect(recovered.reissueStatuses).toEqual(['REISSUE_CS_LOST']);
  });

  it('요청 입력은 해소된 값을 그대로 옮기고 빈 배열은 생략한다', () => {
    const search = ticketIssueListSearch.resolve({
      searched: true,
      vendors: ['ZERO_PLUS'],
      keywords: [{ field: 'reservationNo', value: 'REFERENCE0000001' }],
    });

    expect(toTicketIssueListRequest(search)).toEqual({
      page: 1,
      pageSize: 100,
      sortType: 'registeredAt',
      sortDirection: 'desc',
      periodType: 'reservedAt',
      startDateTime: undefined,
      endDateTime: undefined,
      keywords: [{ field: 'reservationNo', value: 'REFERENCE0000001' }],
      performanceId: undefined,
      scheduleId: undefined,
      vendors: ['ZERO_PLUS'],
      reservationStatuses: undefined,
      issueStatuses: undefined,
      reissueStatuses: undefined,
    });
  });

  it('공연을 고르지 않으면 회차 조건도 요청에서 떨어진다 — 회차는 공연에 종속된 식별자다', () => {
    const orphan = ticketIssueListSearch.resolve({ searched: true, scheduleId: 'reference-schedule-1-1' });
    expect(toTicketIssueListRequest(orphan).scheduleId).toBeUndefined();

    const paired = ticketIssueListSearch.resolve({
      searched: true,
      performanceId: 'reference-performance-1',
      scheduleId: 'reference-schedule-1-1',
    });
    expect(toTicketIssueListRequest(paired).scheduleId).toBe('reference-schedule-1-1');
  });
});
