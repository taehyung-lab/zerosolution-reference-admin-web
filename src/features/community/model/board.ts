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

/**
 * 게시판 한 건이 가질 수 있는 구분. 원문 「게시판을 등록할 수 있다」는 일반·상담·공지사항 택1 이라
 * 적어 검색 영역의 두 개보다 넓다. 두 집합이 다른 이유는 원문이 그렇게 적기 때문이며 좁은 쪽을
 * 넓히거나 넓은 쪽을 좁히지 않는다. 검색에서 공지사항을 고를 수 있는지는 미확인이다.
 */
export const boardRecordCategories = ['GENERAL', 'COUNSEL', 'NOTICE'] as const;
export type BoardRecordCategory = (typeof boardRecordCategories)[number];

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

/** 검색어 대상은 게시판명 하나다(원문 37행). 대상이 하나여도 축을 가진 값으로 다룬다. */
export const boardKeywordFields = ['name'] as const;
export type BoardKeywordField = (typeof boardKeywordFields)[number];

export interface BoardKeyword {
  readonly field: BoardKeywordField;
  readonly value: string;
}

export interface BoardRow {
  readonly id: string;
  readonly type: BoardType;
  readonly category: BoardRecordCategory;
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
  readonly sortType: BoardSortKey;
  readonly sortDirection?: BoardSortDirection;
  readonly periodType: BoardPeriodType;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly BoardKeyword[];
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

/**
 * 업데이트 내역 한 줄. 원문 「게시판정보를 조회할 수 있다」는 `업데이트일 : 수정되어 저장된 날짜`만
 * 적고 나머지 열을 말하지 않는다. 여기 모양은 5개 조회 화면이 공유하는 3열 archetype
 * (`shared/ui/patterns/UpdateHistory`)을 따른 것이고, 게시판의 실제 열 구성은 미확인이다.
 */
export interface BoardChangeLog {
  readonly id: string;
  readonly updatedAt: string;
  /** 바뀐 field 코드. 라벨 해석은 화면의 이력 mapper 가 하고 모르는 코드는 그대로 노출하지 않는다. */
  readonly changes: readonly string[];
  readonly manager: string;
}

/**
 * 게시판 한 건의 조회 값. 필드 집합은 원장 12행(목록 컬럼)이 게시판 레코드의 값으로 열거한 것과
 * 원문 등록 절이 입력으로 열거한 것의 합집합이다. `카테고리`·`피드백 설정`은 존재만 관찰됐고
 * 항목 모양이 미확인이라 여기 넣지 않는다(판정 문서 질문 27·28).
 */
export interface BoardDetail {
  readonly id: string;
  readonly type: BoardType;
  readonly category: BoardRecordCategory;
  readonly name: string;
  readonly writePermission: BoardPermission;
  readonly readPermission: BoardPermission;
  readonly postCount: number;
  readonly usage: BoardUsage;
  readonly registeredAt: string;
  readonly updatedAt: string;
  readonly changeLogs: readonly BoardChangeLog[];
}
