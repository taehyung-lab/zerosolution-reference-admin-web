/**
 * 9.1 게시판의 도메인 값이다. 목록 값은 원장(`docs/reference/zero-sol/09-community.md`)과 Notion 원문
 * (`notion/09-community.md` 「커뮤니티 > 게시판」)이, 조회·등록·수정의 설정 항목은 Figma 9.1.2·9.1.3(+Case)·
 * 9.1.4 frame(2026-09-11 aside 실측, 원장 14·15행)이 열거한 화면 값만 담는다.
 *
 * TRANSPLANT_PENDING_COMMUNITY_BOARD_CONTRACT: 서버 enum·wire 값·정렬 키·페이지 응답 모양은
 * 미확인이다(Admin OpenAPI 없음). 계약이 확정되면 이 목록과 아래 요청 입력을 함께 교체한다.
 */

/** 원장 9행의 관찰은 `일반` 한 항목뿐이다. 등록·수정 frame 도 유형을 `일반` 읽기 전용으로 보여 준다. 나머지 유형은 미확인이다. */
export const boardTypes = ['GENERAL'] as const;
export type BoardType = (typeof boardTypes)[number];

/** 원문 38행: 검색 영역의 구분은 전체·일반·상담이며 전체는 조건 없음이다. */
export const boardCategories = ['GENERAL', 'COUNSEL'] as const;
export type BoardCategory = (typeof boardCategories)[number];

/**
 * 게시판 한 건이 가질 수 있는 구분. 원문 「게시판을 등록할 수 있다」와 Figma Case frame 이 일반·상담·공지사항
 * 택1 이라 적어 검색 영역의 두 개보다 넓다. 두 집합이 다른 이유는 원문이 그렇게 적기 때문이며 좁은 쪽을
 * 넓히거나 넓은 쪽을 좁히지 않는다. 검색에서 공지사항을 고를 수 있는지는 미확인이다.
 */
export const boardRecordCategories = ['GENERAL', 'COUNSEL', 'NOTICE'] as const;
export type BoardRecordCategory = (typeof boardRecordCategories)[number];

/** 원문 38행·Figma: 사용/사용안함. 검색 영역은 여기에 전체(조건 없음)를 더한다. 설정 항목들의 사용 여부도 같은 두 값이다. */
export const boardUsages = ['IN_USE', 'NOT_IN_USE'] as const;
export type BoardUsage = (typeof boardUsages)[number];

/**
 * 게시판 한 건이 가지는 권한 값. 원문 42행과 Figma Case frame 이 이 네 개 중 택1 로 적는다.
 * 검색 영역(원문 41행)은 여기에 `전체`(조건 없음)를 더해 다섯 개를 보여 준다.
 */
export const boardPermissions = [
  'INCLUDING_GUEST',
  'ALL_MEMBERS',
  'MEMBER_GRADE',
  'MANAGER',
] as const;
export type BoardPermission = (typeof boardPermissions)[number];

/** Figma Case frame: `회원등급 >` 아래 2단 cascade 의 등급. 원문 39행 `해당 회원 등급 이상만 가능` 의 등급 값이다. */
export const boardMemberGrades = ['GENERAL_MEMBER', 'SPECIAL_MEMBER'] as const;
export type BoardMemberGrade = (typeof boardMemberGrades)[number];

/** 권한 하나: 회원등급을 고르면 등급이 따라온다(Figma cascade). 다른 값에서는 등급이 없다. */
export interface BoardPermissionSetting {
  readonly permission: BoardPermission;
  readonly memberGrade?: BoardMemberGrade;
}

/** Figma 9.1.3 Case `게시글 제목 지정`: 운영자가 제목 지정 / 작성자가 직접입력 / 사용안함. */
export const boardPostTitleModes = ['MANAGER_TITLES', 'AUTHOR_INPUT', 'NOT_IN_USE'] as const;
export type BoardPostTitleMode = (typeof boardPostTitleModes)[number];

/** Figma 9.1.3 Case `피드백 설정 > 평점`. */
export const boardRatingModes = ['NOT_IN_USE', 'LIKE_DISLIKE', 'RATING', 'LIKE_DISLIKE_AND_RATING'] as const;
export type BoardRatingMode = (typeof boardRatingModes)[number];

/** Figma 9.1.3 Case `비밀댓글`. 댓글이 사용일 때만 고른다. */
export const boardSecretCommentModes = ['PUBLIC_ONLY', 'PRIVATE_ONLY', 'PUBLIC_AND_PRIVATE'] as const;
export type BoardSecretCommentMode = (typeof boardSecretCommentModes)[number];

/** Figma 9.1.3 Case `댓글 알림`. 댓글이 사용일 때만 고른다. */
export const boardCommentNoticeModes = ['NOT_IN_USE', 'EMAIL', 'SMS_SNS', 'EMAIL_OR_SMS_SNS_CHOICE'] as const;
export type BoardCommentNoticeMode = (typeof boardCommentNoticeModes)[number];

/** Figma 9.1.3 `파일첨부 용량제한 * ___ MB (최대 : 10MB)`. */
export const BOARD_ATTACHMENT_LIMIT_MAX_MB = 10;
/** Figma 9.1.3 placeholder `게시판명 (30자 내외)` · `제목 지정 (300자 내외)` · 팝업 `20자 내외`. "내외"라 상한으로 읽는다. */
export const BOARD_NAME_MAX_LENGTH = 30;
export const BOARD_POST_TITLE_MAX_LENGTH = 300;
export const BOARD_CATEGORY_NAME_MAX_LENGTH = 20;

/**
 * 게시판 설정 — Figma 9.1.3(등록)·9.1.4(수정) `기본정보` 섹션의 항목 전부, 화면 순서대로. 조회(9.1.2)는 이 중
 * `팝업`을 보여 주지 않는다. 하위 항목의 활성 조건은 frame 관찰이다: 제목 지정 ← 게시글 제목 지정=운영자가 제목 지정,
 * 용량제한 ← 파일첨부=사용, 비밀댓글·댓글 알림 ← 댓글=사용, 중복 허용 ← 표시=사용(수정 frame; 등록 frame 은 활성 —
 * 판정 문서 질문 33). 등록 frame 초기 상태에서 팝업·평점·댓글이 비활성인 조건도 미확인이다(질문 33). `팝업`이 무엇을
 * 켜는지는 Notion 에 없다(질문 34).
 */
export interface BoardSettings {
  readonly type: BoardType;
  readonly category: BoardRecordCategory;
  readonly name: string;
  readonly write: BoardPermissionSetting;
  readonly read: BoardPermissionSetting;
  readonly categoryUsage: BoardUsage;
  readonly postTitleMode: BoardPostTitleMode;
  /** 운영자가 제목 지정일 때의 제목 목록(각 300자 내외). */
  readonly managerTitles: readonly string[];
  readonly html: BoardUsage;
  readonly attachment: BoardUsage;
  /** 파일첨부가 사용일 때의 MB 상한. 사용안함이면 없다. */
  readonly attachmentLimitMb?: number;
  readonly popup: BoardUsage;
  readonly rating: BoardRatingMode;
  readonly comment: BoardUsage;
  readonly secretComment?: BoardSecretCommentMode;
  readonly commentNotice?: BoardCommentNoticeMode;
  readonly viewCountDisplay: BoardUsage;
  readonly viewCountDuplicate?: BoardUsage;
  readonly usage: BoardUsage;
}

/** Figma 9.1.5.1 팝업 한 행: 순서(드래그)·카테고리명(20자 내외)·사용 상태·삭제. */
export interface BoardCategoryItem {
  readonly id: string;
  readonly name: string;
  readonly usage: BoardUsage;
}

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
 * 업데이트 이력의 변경 한 줄. Figma 9.1.2 는 `업데이트 사항` 열에 `수정` 아래 `게시판명 : 공지 > 1:1문의`,
 * `권한 > 쓰기 : 비회원 > 회원` 처럼 항목 경로·이전 값·이후 값을 적는다. field 는 BoardSettings 의 키 경로이고
 * 값은 화면이 라벨로 옮긴다. 실제 changeLog DTO 는 미확인이다.
 */
export interface BoardChange {
  readonly field: string;
  readonly before?: string;
  readonly after?: string;
}

export interface BoardChangeLog {
  readonly id: string;
  readonly updatedAt: string;
  /** Figma: `등록` 한 줄, 또는 `수정` + 변경 목록. */
  readonly kind: 'CREATE' | 'UPDATE';
  readonly changes: readonly BoardChange[];
  readonly manager: string;
}

/** 게시판 한 건의 조회 값: 설정 전부 + 카테고리 + 이력. 목록 행(BoardRow)은 이 중 일부의 투영이다. */
export interface BoardDetail extends BoardSettings {
  readonly id: string;
  readonly postCount: number;
  readonly registeredAt: string;
  readonly updatedAt: string;
  readonly categories: readonly BoardCategoryItem[];
  readonly changeLogs: readonly BoardChangeLog[];
}
