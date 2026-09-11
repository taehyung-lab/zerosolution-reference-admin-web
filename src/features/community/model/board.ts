/**
 * 9.1 게시판의 도메인 값이다. 원장(`docs/reference/zero-sol/09-community.md`)과 Notion 원문
 * (`notion/09-community.md` 「커뮤니티 > 게시판」)이 열거한 화면 값만 담는다.
 *
 * TRANSPLANT_PENDING_COMMUNITY_BOARD_CONTRACT: 서버 enum·wire 값·정렬 키·페이지 응답 모양은
 * 미확인이다(Admin OpenAPI 없음). 계약이 확정되면 이 목록과 아래 요청 입력을 함께 교체한다.
 */

/** 원장 9행의 관찰은 `일반` 한 항목뿐이다. 나머지 유형이 있는지는 미확인이다. */
export const boardTypes = ['GENERAL'] as const;
export type BoardType = (typeof boardTypes)[number];

/** 원문 38행: 검색 영역의 구분은 전체·일반·상담이며 전체는 조건 없음이다. */
export const boardCategories = ['GENERAL', 'COUNSEL'] as const;
export type BoardCategory = (typeof boardCategories)[number];

/** 원문 38행: 사용상태는 전체·사용·사용안함이며 전체는 조건 없음이다. */
export const boardUsages = ['IN_USE', 'NOT_IN_USE'] as const;
export type BoardUsage = (typeof boardUsages)[number];

/**
 * 게시판 한 건이 가지는 권한 값. 원문 42행의 등록 화면이 이 네 개 중 택1 로 적는다.
 * 검색 영역(원문 41행)은 여기에 `전체`(조건 없음)를 더해 다섯 개를 보여 준다.
 */
export const boardPermissions = [
  'INCLUDING_GUEST',
  'ALL_MEMBERS',
  'MEMBER_GRADE',
  'MANAGER',
] as const;
export type BoardPermission = (typeof boardPermissions)[number];

/** 원문 35행: 기간 기준은 등록일·최근업데이트일이다. */
export const boardPeriodTypes = ['registeredAt', 'updatedAt'] as const;
export type BoardPeriodType = (typeof boardPeriodTypes)[number];

/** 원장 13행(2026-09-10 사용자 확정): 정렬 7개. */
export const boardSortKeys = [
  'registeredAt',
  'updatedAt',
  'type',
  'category',
  'name',
  'permission',
  'postCount',
] as const;
export type BoardSortKey = (typeof boardSortKeys)[number];

export type BoardSortDirection = 'asc' | 'desc';

/** 검색어 대상은 게시판명 하나다(원문 37행). */
export const boardKeywordFields = ['name'] as const;
export type BoardKeywordField = (typeof boardKeywordFields)[number];

export interface BoardRow {
  readonly id: string;
  readonly type: BoardType;
  readonly category: BoardCategory;
  readonly name: string;
  readonly writePermission: BoardPermission;
  readonly readPermission: BoardPermission;
  readonly postCount: number;
  readonly usage: BoardUsage;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** 화면이 조립해 API 경계로 넘기는 조회 입력. 해소된 URL 값과 정확히 같은 값이 Query 키에도 들어간다. */
export interface BoardListRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sort: BoardSortKey;
  readonly sortDirection?: BoardSortDirection;
  readonly periodType: BoardPeriodType;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly names?: readonly string[];
  readonly types?: readonly BoardType[];
  readonly categories?: readonly BoardCategory[];
  readonly usages?: readonly BoardUsage[];
  readonly writePermission?: BoardPermission;
  readonly readPermission?: BoardPermission;
}

export interface BoardListPage {
  readonly rows: readonly BoardRow[];
  readonly total: number;
}
