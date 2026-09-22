/**
 * 6.2 전체발권(발권 > 전체발권)의 도메인 값이다. 집합·기본값·필수 여부는
 * `product/facts/TICKET-ISSUE-LIST.md` 가 소유하고 이 파일은 그 관찰의 내부 철자만 정한다.
 *
 * TRANSPLANT_PENDING_TICKETING_ISSUE_CONTRACT: 서버 enum·wire 값·정렬 키·페이지 응답 모양은
 * 미확인이다(신규 Admin OpenAPI 없음). 계약이 확정되면 이 목록과 아래 요청 입력을 함께 교체한다.
 */

/** fact 「기간」 기준 7개. 화면 순서 그대로다. */
export const ticketIssuePeriodTypes = [
  'reservedAt',
  'reservationCanceledAt',
  'issuedAt',
  'issueCanceledAt',
  'lostAt',
  'registeredAt',
  'updatedAt',
] as const;
export type TicketIssuePeriodType = (typeof ticketIssuePeriodTypes)[number];

/** fact 「검색어」 대상 7개. 다중 키워드를 허용한다. */
export const ticketIssueKeywordFields = [
  'reservationNo',
  'seatNo',
  'grade',
  'buyerName',
  'buyerPhone',
  'paymentMethod',
  'discount',
] as const;
export type TicketIssueKeywordField = (typeof ticketIssueKeywordFields)[number];

export interface TicketIssueKeyword {
  readonly field: TicketIssueKeywordField;
  readonly value: string;
}

/** fact 「예매처」 6개. 검색 영역은 여기에 `전체`(조건 없음)를 더한다. */
export const ticketVendors = [
  'ZERO_PLUS',
  'MELON_TICKET',
  'TICKET_LINK',
  'NOL_UNIVERSE',
  'YES24',
  'ETC',
] as const;
export type TicketVendor = (typeof ticketVendors)[number];

/** fact 「예매상태」 2개. */
export const reservationStatuses = ['RESERVED', 'CANCELED'] as const;
export type ReservationStatus = (typeof reservationStatuses)[number];

/**
 * 표의 `발권상태` 셀이 가질 수 있는 값 넷. 검색 조건이 고를 수 있는 값은 이보다 좁다
 * (fact 미확인 7 — frame 의 조건 선택지는 발권완료·분실 둘뿐이다).
 */
export const ticketIssueStatuses = ['PENDING', 'ISSUED', 'CANCELED', 'LOST'] as const;
export type TicketIssueStatus = (typeof ticketIssueStatuses)[number];

/** fact 「발권상태」 조건 선택지. 표 값의 부분집합이며 넓히지 않는다. */
export const ticketIssueStatusFilters = ['ISSUED', 'LOST'] as const;
export type TicketIssueStatusFilter = (typeof ticketIssueStatusFilters)[number];

/**
 * fact 「재발권상태」. frame 은 `신규발권` 과 `재발권 ( CS 분실 · CS 인쇄불량 · CS 기타 · 일반 )` 을
 * 그리므로 `재발권` 은 아래 네 leaf 를 묶는 가지이고 조건 값 자체가 아니다.
 */
export const reissueStatuses = [
  'NEW',
  'REISSUE_CS_LOST',
  'REISSUE_CS_MISPRINT',
  'REISSUE_CS_ETC',
  'REISSUE_GENERAL',
] as const;
export type ReissueStatus = (typeof reissueStatuses)[number];

/** fact 「보기·정렬」 19축. frame 목록 순서 그대로이며 URL enum·select 옵션이 여기서 나온다. */
export const ticketIssueSortKeys = [
  'registeredAt',
  'updatedAt',
  'reservedAt',
  'reservationCanceledAt',
  'issuedAt',
  'performanceType',
  'performanceName',
  'round',
  'performedAt',
  'reservationNo',
  'seatNo',
  'grade',
  'buyerName',
  'buyerPhone',
  'paymentMethod',
  'paymentAmount',
  'discount',
  'vendor',
  'issueStatus',
] as const;
export type TicketIssueSortKey = (typeof ticketIssueSortKeys)[number];

export type TicketIssueSortDirection = 'asc' | 'desc';

/** 공연 검색 lookup 의 결과 한 건. 라벨은 frame 의 chip `[서울] IVE THE FIRST FAN CONCERT` 그대로다. */
export interface TicketIssuePerformance {
  readonly id: string;
  readonly name: string;
}

/** 공연일 select 의 한 항목. 라벨 `1회차 2026-01-03 14:00 ~ 2026-01-03 16:00` 은 화면이 조립한다. */
export interface TicketIssueSchedule {
  readonly id: string;
  readonly round: number;
  readonly startAt: string;
  readonly endAt: string;
}

/** 표 한 행. 복합 셀의 묶음(공연정보·예매정보·예매자정보·결제정보)은 컬럼 파일이 정한다. */
export interface TicketIssueRow {
  readonly id: string;
  readonly performanceType: string;
  readonly performanceName: string;
  readonly round: number;
  readonly performedAt: string;
  readonly reservationNo: string;
  readonly seatNo: string;
  readonly grade: string;
  /** 원본 일련번호. 표는 마스킹해서 그린다. */
  readonly ticketSerialNo: string;
  readonly buyerName: string;
  /** 원본 연락처. 표는 마스킹해서 그린다. */
  readonly buyerPhone: string;
  readonly paymentMethod: string;
  readonly paymentAmount: number;
  /** 없으면 빈 문자열이고 표는 `-` 로 그린다. */
  readonly discount: string;
  readonly vendor: TicketVendor;
  readonly issueStatus: TicketIssueStatus;
  /** 아직 발권하지 않은 행은 없다. 표는 `-` 로 그린다. */
  readonly lastIssuedAt?: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** 화면이 조립해 API 경계로 넘기는 조회 입력. 해소된 URL 값과 정확히 같은 값이 Query 키에도 들어간다. */
export interface TicketIssueListRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: TicketIssueSortKey;
  readonly sortDirection: TicketIssueSortDirection;
  readonly periodType: TicketIssuePeriodType;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly TicketIssueKeyword[];
  readonly performanceId?: string;
  /** 공연일. `전체` 는 조건 없음이라 보내지 않는다. */
  readonly scheduleId?: string;
  readonly vendors?: readonly TicketVendor[];
  readonly reservationStatuses?: readonly ReservationStatus[];
  readonly issueStatuses?: readonly TicketIssueStatusFilter[];
  readonly reissueStatuses?: readonly ReissueStatus[];
}

/** 결과 영역 맨 위의 상태 카운트. `총` 은 `total` 이 소유한다. */
export interface TicketIssueCounts {
  readonly pending: number;
  readonly issued: number;
  readonly reissued: number;
  readonly lost: number;
}

export interface TicketIssueListPage {
  readonly rows: readonly TicketIssueRow[];
  readonly total: number;
  readonly counts: TicketIssueCounts;
}

/** 일괄변경 `선택 ▾` 의 cascade 한 축(fact toolbar): 발권상태 > 발권취소 · 분실. */
export interface TicketIssueBulkChange {
  readonly field: 'issueStatus';
  readonly value: Extract<TicketIssueStatus, 'CANCELED' | 'LOST'>;
}

export const ticketIssueBulkChanges: readonly TicketIssueBulkChange[] = [
  { field: 'issueStatus', value: 'CANCELED' },
  { field: 'issueStatus', value: 'LOST' },
];

/** 다운로드 범위. frame 의 `선택한 항목` · `검색결과 전체` 두 항목이다. */
export const ticketIssueDownloadScopes = ['SELECTED', 'ALL'] as const;
export type TicketIssueDownloadScope = (typeof ticketIssueDownloadScopes)[number];
