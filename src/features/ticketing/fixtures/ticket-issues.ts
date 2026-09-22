import type {
  TicketIssueKeywordField,
  TicketIssueListPage,
  TicketIssueListRequest,
  TicketIssuePerformance,
  TicketIssueRow,
  TicketIssueSchedule,
  TicketIssueSortKey,
} from '../model/ticket-issue';

/**
 * TRANSPLANT_PENDING_TICKETING_ISSUE_QUERY: 이 저장소에는 발권 내역 조회 API 가 없다(AGENTS 1절).
 * 아래 행과 필터·정렬·페이지·카운트 계산은 서버 페이지 응답을 흉내 내는 예시이며 endpoint·DTO·enum 을
 * 확정 계약으로 표현하지 않는다. 실제 계약이 확정되면 `api/queries.ts` 의 queryFn 과 함께 교체하고
 * feature 에는 검색 입력 매핑과 응답 projection 만 남긴다.
 */
const performances: readonly TicketIssuePerformance[] = [
  { id: 'reference-performance-1', name: '[서울] REFERENCE FIRST FAN CONCERT' },
  { id: 'reference-performance-2', name: '[부산] REFERENCE WINTER STAGE' },
];

const schedules: Readonly<Record<string, readonly TicketIssueSchedule[]>> = {
  'reference-performance-1': [
    { id: 'reference-schedule-1-1', round: 1, startAt: '2026-01-03T05:00:00.000Z', endAt: '2026-01-03T07:00:00.000Z' },
    { id: 'reference-schedule-1-2', round: 2, startAt: '2026-01-04T05:00:00.000Z', endAt: '2026-01-04T07:00:00.000Z' },
  ],
  'reference-performance-2': [
    { id: 'reference-schedule-2-1', round: 1, startAt: '2026-02-14T09:00:00.000Z', endAt: '2026-02-14T11:00:00.000Z' },
  ],
};

interface TicketIssueFixture extends TicketIssueRow {
  readonly performanceId: string;
  readonly scheduleId: string;
  readonly reservationStatus: 'RESERVED' | 'CANCELED';
  readonly reissueStatus: 'NEW' | 'REISSUE_CS_LOST' | 'REISSUE_CS_MISPRINT' | 'REISSUE_CS_ETC' | 'REISSUE_GENERAL';
  readonly reservedAt: string;
  readonly reservationCanceledAt?: string;
  readonly issuedAt?: string;
  readonly issueCanceledAt?: string;
  readonly lostAt?: string;
}

const issues: readonly TicketIssueFixture[] = [
  {
    id: 'reference-issue-1',
    performanceId: 'reference-performance-1',
    scheduleId: 'reference-schedule-1-1',
    performanceType: '콘서트',
    performanceName: '[서울] REFERENCE FIRST FAN CONCERT',
    round: 1,
    performedAt: '2026-01-03T05:00:00.000Z',
    reservationNo: 'REFERENCE0000001',
    seatNo: '1층 1구역 1열 001',
    grade: 'VIP',
    ticketSerialNo: '12000023',
    buyerName: '예시 예매자 1',
    buyerPhone: '010-1111-1234',
    paymentMethod: '신용(한국)카드',
    paymentAmount: 150000,
    discount: '',
    vendor: 'ZERO_PLUS',
    issueStatus: 'CANCELED',
    lastIssuedAt: '2026-06-01T03:00:00.000Z',
    registeredAt: '2026-06-01T03:00:00.000Z',
    updatedAt: '2026-06-01T03:00:00.000Z',
    reservationStatus: 'RESERVED',
    reissueStatus: 'NEW',
    reservedAt: '2026-05-20T02:00:00.000Z',
    issuedAt: '2026-06-01T03:00:00.000Z',
    issueCanceledAt: '2026-06-02T03:00:00.000Z',
  },
  {
    id: 'reference-issue-2',
    performanceId: 'reference-performance-1',
    scheduleId: 'reference-schedule-1-1',
    performanceType: '콘서트',
    performanceName: '[서울] REFERENCE FIRST FAN CONCERT',
    round: 1,
    performedAt: '2026-01-03T05:00:00.000Z',
    reservationNo: 'REFERENCE0000002',
    seatNo: '1층 1구역 1열 002',
    grade: 'VIP',
    ticketSerialNo: '12000024',
    buyerName: '예시 예매자 2',
    buyerPhone: '010-2222-1234',
    paymentMethod: '신용(한국)카드',
    paymentAmount: 150000,
    discount: '',
    vendor: 'MELON_TICKET',
    issueStatus: 'PENDING',
    registeredAt: '2026-06-02T01:20:00.000Z',
    updatedAt: '2026-06-02T01:20:00.000Z',
    reservationStatus: 'RESERVED',
    reissueStatus: 'NEW',
    reservedAt: '2026-05-21T02:00:00.000Z',
  },
  {
    id: 'reference-issue-3',
    performanceId: 'reference-performance-1',
    scheduleId: 'reference-schedule-1-2',
    performanceType: '콘서트',
    performanceName: '[서울] REFERENCE FIRST FAN CONCERT',
    round: 2,
    performedAt: '2026-01-04T05:00:00.000Z',
    reservationNo: 'REFERENCE0000003',
    seatNo: '2층 3구역 5열 011',
    grade: 'R',
    ticketSerialNo: '12000025',
    buyerName: '예시 예매자 3',
    buyerPhone: '010-3333-1234',
    paymentMethod: '계좌이체',
    paymentAmount: 99000,
    discount: '조기예매 10%',
    vendor: 'TICKET_LINK',
    issueStatus: 'ISSUED',
    lastIssuedAt: '2026-06-09T22:05:00.000Z',
    registeredAt: '2026-06-09T22:05:00.000Z',
    updatedAt: '2026-09-01T02:10:00.000Z',
    reservationStatus: 'RESERVED',
    reissueStatus: 'REISSUE_CS_MISPRINT',
    reservedAt: '2026-05-30T02:00:00.000Z',
    issuedAt: '2026-06-09T22:05:00.000Z',
  },
  {
    id: 'reference-issue-4',
    performanceId: 'reference-performance-2',
    scheduleId: 'reference-schedule-2-1',
    performanceType: '뮤지컬',
    performanceName: '[부산] REFERENCE WINTER STAGE',
    round: 1,
    performedAt: '2026-02-14T09:00:00.000Z',
    reservationNo: 'REFERENCE0000004',
    seatNo: '1층 2구역 2열 007',
    grade: 'S',
    ticketSerialNo: '12000026',
    buyerName: '예시 예매자 4',
    buyerPhone: '010-4444-1234',
    paymentMethod: '간편결제',
    paymentAmount: 77000,
    discount: '',
    vendor: 'YES24',
    issueStatus: 'LOST',
    lastIssuedAt: '2026-07-14T06:45:00.000Z',
    registeredAt: '2026-07-14T06:45:00.000Z',
    updatedAt: '2026-07-20T06:45:00.000Z',
    reservationStatus: 'RESERVED',
    reissueStatus: 'REISSUE_CS_LOST',
    reservedAt: '2026-07-01T02:00:00.000Z',
    issuedAt: '2026-07-14T06:45:00.000Z',
    lostAt: '2026-07-20T06:45:00.000Z',
  },
  {
    id: 'reference-issue-5',
    performanceId: 'reference-performance-2',
    scheduleId: 'reference-schedule-2-1',
    performanceType: '뮤지컬',
    performanceName: '[부산] REFERENCE WINTER STAGE',
    round: 1,
    performedAt: '2026-02-14T09:00:00.000Z',
    reservationNo: 'REFERENCE0000005',
    seatNo: '1층 2구역 2열 008',
    grade: 'S',
    ticketSerialNo: '12000027',
    buyerName: '예시 예매자 5',
    buyerPhone: '010-5555-1234',
    paymentMethod: '간편결제',
    paymentAmount: 77000,
    discount: '제휴카드 5%',
    vendor: 'NOL_UNIVERSE',
    issueStatus: 'PENDING',
    registeredAt: '2026-08-03T11:30:00.000Z',
    updatedAt: '2026-09-10T00:05:00.000Z',
    reservationStatus: 'CANCELED',
    reissueStatus: 'NEW',
    reservedAt: '2026-07-25T02:00:00.000Z',
    reservationCanceledAt: '2026-09-10T00:05:00.000Z',
  },
];

function periodInstant(row: TicketIssueFixture, request: TicketIssueListRequest): string | undefined {
  switch (request.periodType) {
    case 'reservedAt':
      return row.reservedAt;
    case 'reservationCanceledAt':
      return row.reservationCanceledAt;
    case 'issuedAt':
      return row.issuedAt;
    case 'issueCanceledAt':
      return row.issueCanceledAt;
    case 'lostAt':
      return row.lostAt;
    case 'registeredAt':
      return row.registeredAt;
    case 'updatedAt':
      return row.updatedAt;
  }
}

function keywordValue(row: TicketIssueFixture, field: TicketIssueKeywordField): string {
  switch (field) {
    case 'reservationNo':
      return row.reservationNo;
    case 'seatNo':
      return row.seatNo;
    case 'grade':
      return row.grade;
    case 'buyerName':
      return row.buyerName;
    case 'buyerPhone':
      return row.buyerPhone;
    case 'paymentMethod':
      return row.paymentMethod;
    case 'discount':
      return row.discount;
  }
}

function sortValue(row: TicketIssueFixture, key: TicketIssueSortKey): string {
  switch (key) {
    case 'registeredAt':
      return row.registeredAt;
    case 'updatedAt':
      return row.updatedAt;
    case 'reservedAt':
      return row.reservedAt;
    case 'reservationCanceledAt':
      return row.reservationCanceledAt ?? '';
    case 'issuedAt':
      return row.issuedAt ?? '';
    case 'performanceType':
      return row.performanceType;
    case 'performanceName':
      return row.performanceName;
    case 'round':
      return String(row.round).padStart(4, '0');
    case 'performedAt':
      return row.performedAt;
    case 'reservationNo':
      return row.reservationNo;
    case 'seatNo':
      return row.seatNo;
    case 'grade':
      return row.grade;
    case 'buyerName':
      return row.buyerName;
    case 'buyerPhone':
      return row.buyerPhone;
    case 'paymentMethod':
      return row.paymentMethod;
    case 'paymentAmount':
      return String(row.paymentAmount).padStart(12, '0');
    case 'discount':
      return row.discount;
    case 'vendor':
      return row.vendor;
    case 'issueStatus':
      return row.issueStatus;
  }
}

function matches(row: TicketIssueFixture, request: TicketIssueListRequest): boolean {
  const instant = periodInstant(row, request);
  if (request.startDateTime !== undefined && (instant === undefined || instant < request.startDateTime)) return false;
  if (request.endDateTime !== undefined && (instant === undefined || instant > request.endDateTime)) return false;
  if (request.keywords?.length && !request.keywords.some(({ field, value }) => keywordValue(row, field).includes(value))) {
    return false;
  }
  if (request.performanceId !== undefined && row.performanceId !== request.performanceId) return false;
  if (request.scheduleId !== undefined && row.scheduleId !== request.scheduleId) return false;
  if (request.vendors?.length && !request.vendors.includes(row.vendor)) return false;
  if (request.reservationStatuses?.length && !request.reservationStatuses.includes(row.reservationStatus)) return false;
  if (request.issueStatuses?.length) {
    const selectable = row.issueStatus === 'ISSUED' || row.issueStatus === 'LOST';
    if (!selectable || !request.issueStatuses.includes(row.issueStatus)) return false;
  }
  if (request.reissueStatuses?.length && !request.reissueStatuses.includes(row.reissueStatus)) return false;
  return true;
}

export function readTicketIssuePerformances(): Promise<readonly TicketIssuePerformance[]> {
  return Promise.resolve(performances);
}

export function readTicketIssueSchedules(performanceId: string): Promise<readonly TicketIssueSchedule[]> {
  return Promise.resolve(schedules[performanceId] ?? []);
}

export function readTicketIssueListPage(request: TicketIssueListRequest): Promise<TicketIssueListPage> {
  const filtered = issues.filter((row) => matches(row, request));
  const descending = request.sortDirection === 'desc';
  const sorted = [...filtered].sort((left, right) => {
    const a = sortValue(left, request.sortType);
    const b = sortValue(right, request.sortType);
    const order = a === b ? 0 : a < b ? -1 : 1;
    return descending ? -order : order;
  });
  const start = (request.page - 1) * request.pageSize;
  return Promise.resolve({
    rows: sorted.slice(start, start + request.pageSize),
    total: sorted.length,
    counts: {
      pending: filtered.filter((row) => row.issueStatus === 'PENDING').length,
      issued: filtered.filter((row) => row.issueStatus === 'ISSUED').length,
      reissued: filtered.filter((row) => row.reissueStatus !== 'NEW').length,
      lost: filtered.filter((row) => row.issueStatus === 'LOST').length,
    },
  });
}
