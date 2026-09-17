/**
 * 5.1 콘텐츠 목록의 도메인 값. 원장(`docs/reference/zero-sol/05-performances.md` 5.1 행)과
 * 2026-09-17 재관찰한 Figma `5.1.1. 콘텐츠 리스트`(`129:21882`)·`5.1.1.1. Case 정의`(`129:21800`)가
 * 열거한 화면 값만 담는다. 구분·공연유형은 같은 도메인 값이라 `performance.ts` 가 소유한다.
 *
 * TRANSPLANT_PENDING_CONTENT_CONTRACT: 서버 enum·wire 값·페이지 응답 모양·미리보기 대상은 미확인이다.
 * 계약이 확정되면 이 목록과 요청 입력을 함께 교체한다.
 */

export const contentPeriodTypes = ['performedAt', 'registeredAt', 'updatedAt'] as const;
export type ContentPeriodType = (typeof contentPeriodTypes)[number];

export const contentKeywordFields = ['title', 'performers', 'organizer'] as const;
export type ContentKeywordField = (typeof contentKeywordFields)[number];

export interface ContentKeyword {
  readonly field: ContentKeywordField;
  readonly value: string;
}

/** 원장 toolbar 좌 정렬 목록의 순서. 5.2 와 달리 `사용 상태` 가 있다. */
export const contentSortKeys = [
  'registeredAt',
  'updatedAt',
  'period',
  'ticketKind',
  'performanceType',
  'title',
  'performers',
  'organizer',
  'usageStatus',
] as const;
export type ContentSortKey = (typeof contentSortKeys)[number];

/** 검색 영역의 사용상태와 일괄변경 cascade(`사용 상태 > 사용 / 사용안함`)가 같은 값을 쓴다. */
export const contentUsageStatuses = ['inUse', 'notInUse'] as const;
export type ContentUsageStatus = (typeof contentUsageStatuses)[number];

export interface ContentRow {
  readonly id: string;
  readonly ticketKind: string;
  readonly performanceType: string;
  readonly title: string;
  readonly sessionCount: number;
  readonly performers: string;
  readonly organizer: string;
  readonly period: string;
  readonly venueId: string;
  readonly usageStatus: ContentUsageStatus;
  /** 원장 table: 콘텐츠가 등록된 행만 `미리보기` 링크를 갖고 나머지는 `-` 다. */
  readonly hasPreview: boolean;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** 화면이 조립해 API 경계로 넘기는 조회 입력. 해소된 URL 값과 정확히 같은 값이 Query 키에도 들어간다. */
export interface ContentListRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: ContentSortKey;
  readonly sortDirection: 'asc' | 'desc';
  readonly periodType: ContentPeriodType;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly ContentKeyword[];
  readonly ticketKinds?: readonly string[];
  readonly performanceTypes?: readonly string[];
  readonly usageStatuses?: readonly string[];
  readonly venueId?: string;
}

export interface ContentListPage {
  readonly rows: readonly ContentRow[];
  readonly total: number;
}

/** 일괄변경의 대상과 값. cascade 가 끝난 뒤에만 만들어진다. */
export interface ContentBulkChangeRequest {
  readonly targetIds: readonly string[];
  readonly usageStatus: ContentUsageStatus;
}

/**
 * 미리보기 팝업이 그리는 한 장. Figma `5.1.4.1. 팝업 : 미리보기`(`129:21393`)는 타이틀·이미지·영상
 * 영역만 자리표시자로 그려 두었고, 실제 미리보기 대상은 시나리오 §6 의 미확인이다.
 */
export interface ContentPreviewCard {
  readonly session: string;
  readonly language: string;
  readonly title: string;
  readonly imageTitle: string;
  readonly videoTitle: string;
}

export interface ContentPreview {
  /** Notion: `입력방식 : 전체 회차 일괄 등록` 이면 회차 셀렉박스를 제공하지 않는다 — 그때 빈 배열이다. */
  readonly sessions: readonly string[];
  readonly languages: readonly string[];
  readonly cards: readonly ContentPreviewCard[];
}
