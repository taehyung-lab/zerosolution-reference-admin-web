import { z } from 'zod';
import {
  reissueStatuses,
  reservationStatuses,
  ticketIssueKeywordFields,
  ticketIssuePeriodTypes,
  ticketIssueSortKeys,
  ticketIssueStatusFilters,
  ticketVendors,
  type TicketIssueListRequest,
} from '@/features/ticketing/model/ticket-issue';
import { nonEmptyArray } from '@/shared/lib/search';
import { optionalInstant, optionalPositiveInteger, recoverArrayItems } from '@/shared/lib/search-codecs';
import { defineGatedSearchFields } from '@/shared/lib/search-fields';
import { standardPageSizeOptions } from '@/shared/lib/list-options';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/**
 * 6.2 전체발권 목록의 URL 필드 선언. 이 화면은 검색 전 상태를 가진다
 * (`product/facts/TICKET-ISSUE-LIST.md` 구성: 「화면 진입시, 검색 안내 화면이 제공된다」) — 빈 URL 이
 * 검색 전이고 `searched` 표식이 조회를 연다. 기본값의 근거:
 * - pageSize 100 · sortType 등록일: fact 보기·정렬(frame 의 닫힌 select).
 * - sortDirection desc: 목록 공통(2026-09-11 사용자 확정).
 * - periodType 예매일: fact 기간 기준 목록의 첫 항목이자 frame 의 닫힌 select 값.
 * - 배열 필터의 빈 값 = 전체(조건 없음). 공연·공연일은 하나를 고르며 비우면 조건 없음이다.
 *
 * `scheduleId` 는 공연일이다. frame 의 `전체` 는 화면 전용 항목이라 URL 로 나가지 않는다.
 */
export const ticketIssueListSearch = defineGatedSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: {
    schema: z.enum(ticketIssueSortKeys).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'view',
  },
  sortDirection: {
    schema: z.enum(['asc', 'desc']).optional().catch(undefined),
    defaultValue: 'desc',
    kind: 'view',
  },
  periodType: {
    schema: z.enum(ticketIssuePeriodTypes).optional().catch(undefined),
    defaultValue: 'reservedAt',
    kind: 'filter',
  },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArrayItems(
      z.object({ field: z.enum(ticketIssueKeywordFields), value: z.string().trim().min(1) }),
    ),
    defaultValue: [],
    kind: 'filter',
  },
  performanceId: {
    schema: z.string().min(1).optional().catch(undefined),
    defaultValue: undefined,
    kind: 'filter',
  },
  scheduleId: {
    schema: z.string().min(1).optional().catch(undefined),
    defaultValue: undefined,
    kind: 'filter',
  },
  vendors: { schema: recoverArrayItems(z.enum(ticketVendors)), defaultValue: [], kind: 'filter' },
  reservationStatuses: {
    schema: recoverArrayItems(z.enum(reservationStatuses)),
    defaultValue: [],
    kind: 'filter',
  },
  issueStatuses: {
    schema: recoverArrayItems(z.enum(ticketIssueStatusFilters)),
    defaultValue: [],
    kind: 'filter',
  },
  reissueStatuses: {
    schema: recoverArrayItems(z.enum(reissueStatuses)),
    defaultValue: [],
    kind: 'filter',
  },
});

/** route 가 검증해 넘기는 sparse URL. */
export type TicketIssueListSearch = z.output<typeof ticketIssueListSearch.schema>;
/** 화면이 한 번 해소해 쓰는 전체 검색 값. `searched` 는 조회를 여는 표식이다. */
export type TicketIssueListView = ReturnType<typeof ticketIssueListSearch.resolve>;

/**
 * 해소된 URL 값을 요청 입력으로 옮긴다. Query 키도 같은 객체다.
 * 공연을 고르지 않으면 공연일 조건도 보내지 않는다 — 회차는 공연에 종속된 식별자다.
 */
export function toTicketIssueListRequest(search: TicketIssueListView): TicketIssueListRequest {
  return {
    page: search.page,
    pageSize: search.pageSize,
    sortType: search.sortType,
    sortDirection: search.sortDirection,
    periodType: search.periodType,
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
    keywords: nonEmptyArray(search.keywords),
    performanceId: search.performanceId,
    scheduleId: search.performanceId === undefined ? undefined : search.scheduleId,
    vendors: nonEmptyArray(search.vendors),
    reservationStatuses: nonEmptyArray(search.reservationStatuses),
    issueStatuses: nonEmptyArray(search.issueStatuses),
    reissueStatuses: nonEmptyArray(search.reissueStatuses),
  };
}
