/**
 * 5.2 공연 목록의 도메인 값. 검색 조건·정렬·컬럼은 원장(`docs/reference/zero-sol/05-performances.md`)이 열거한
 * 화면 값만 담는다. 조회 화면의 값은 `performance-detail.ts` 가 소유한다.
 *
 * TRANSPLANT_PENDING_PERFORMANCE_CONTRACT: 서버 enum·wire 값·옵션 식별자·페이지 응답 모양은 미확인이다.
 * 계약이 확정되면 이 목록과 요청 입력을 함께 교체한다.
 */

export const performancePeriodTypes = ['performedAt', 'registeredAt', 'updatedAt'] as const;
export type PerformancePeriodType = (typeof performancePeriodTypes)[number];

export const performanceKeywordFields = ['title', 'performers', 'organizer'] as const;
export type PerformanceKeywordField = (typeof performanceKeywordFields)[number];

export interface PerformanceKeyword {
  readonly field: PerformanceKeywordField;
  readonly value: string;
}

export const performanceSortKeys = [
  'registeredAt',
  'updatedAt',
  'period',
  'ticketKind',
  'performanceType',
  'title',
  'performers',
  'organizer',
] as const;
export type PerformanceSortKey = (typeof performanceSortKeys)[number];

/** 원장 검색 영역의 구분·공연유형·예매처 선택지. 라벨은 `options.*` 번역이 소유한다. */
export const performanceTicketKinds = ['day', 'period'] as const;
export const performanceTypes = [
  'concert',
  'musical',
  'exhibition',
  'festival',
  'theatre',
  'sports',
  'membership',
] as const;
export const performanceSellers = ['zero', 'melon', 'ticketlink', 'nol', 'yes24', 'other'] as const;

export interface PerformanceVenue {
  readonly id: string;
  readonly name: string;
}

export interface PerformanceRow {
  readonly id: string;
  readonly ticketKind: string;
  readonly performanceType: string;
  readonly title: string;
  readonly sessionCount: number;
  readonly performers: string;
  readonly organizer: string;
  readonly period: string;
  readonly venueId: string;
  readonly venueName: string;
  readonly seller: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** 화면이 조립해 API 경계로 넘기는 조회 입력. 해소된 URL 값과 정확히 같은 값이 Query 키에도 들어간다. */
export interface PerformanceListRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: PerformanceSortKey;
  readonly sortDirection: 'asc' | 'desc';
  readonly periodType: PerformancePeriodType;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly PerformanceKeyword[];
  readonly ticketKinds?: readonly string[];
  readonly performanceTypes?: readonly string[];
  readonly sellers?: readonly string[];
  readonly venueId?: string;
}

export interface PerformanceListPage {
  readonly rows: readonly PerformanceRow[];
  readonly total: number;
}
