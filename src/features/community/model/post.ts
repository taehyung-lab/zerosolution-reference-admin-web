/**
 * 9.2 게시물의 도메인 값이다. 목록 값의 근거는 Figma `9.2.1. 게시물 리스트` frame 과 그 옆의
 * Case 정의 frame(레이어 이름은 `9.1.1.1. Case 정의` 지만 내용은 9.2.1 의 것이다 — 2026-09-22 aside 실측),
 * 그리고 Notion 원문 「게시물 리스트를 조회할 수 있다」(`docs/reference/zero-sol/notion/09-community.md`)다.
 * 제품 사실은 `product/facts/POST-LIST.md` 가 소유하고 여기에는 그 값의 코드 표현만 둔다.
 *
 * TRANSPLANT_PENDING_COMMUNITY_POST_CONTRACT: 서버 enum·wire 값·정렬 키·페이지 응답 모양은
 * 미확인이다(Admin OpenAPI 없음). 계약이 확정되면 이 목록과 아래 요청 입력을 함께 교체한다.
 */

/** Case 정의 `구분` : 전체 | 일반 · 상담. 전체는 조건 없음이라 값이 아니다(Notion `default : 전체`). */
export const postCategories = ['GENERAL', 'COUNSEL'] as const;
export type PostCategory = (typeof postCategories)[number];

/**
 * Case 정의 `회원유형` : 전체 · 비회원 포함 · 전체회원 · 운영자 중 택1(Notion 동일). 전체는 조건 없음이다.
 * 표의 `회원유형/회원등급` 셀이 그리는 값(`일반회원`·`운영자`)과 어휘가 달라 같은 축으로 합치지 않는다
 * (POST-LIST 미확인 2).
 */
export const postMemberTypes = ['INCLUDING_GUEST', 'ALL_MEMBERS', 'MANAGER'] as const;
export type PostMemberType = (typeof postMemberTypes)[number];

/** Case 정의 `답변상태` : 전체 | 대기 · 검토중 · 완료 다중선택(Notion 동일). */
export const postAnswerStatuses = ['PENDING', 'REVIEWING', 'DONE'] as const;
export type PostAnswerStatus = (typeof postAnswerStatuses)[number];

/**
 * Case 정의 `게시상태` : 전체 | 사용 · 사용안함 다중선택(Notion `사용상태 → 전체, 사용, 사용안함`).
 * 같은 축을 표와 일괄변경은 `게시`·`게시안함` 으로 그린다 — 라벨 두 벌이 관찰이고 값은 하나다
 * (POST-LIST 미확인 3).
 */
export const postStatuses = ['IN_USE', 'NOT_IN_USE'] as const;
export type PostStatus = (typeof postStatuses)[number];

/**
 * 표의 `회원유형/회원등급` 왼쪽 값. frame 이 그린 것은 `일반회원`(APP 회원 행)과 `운영자` 두 개뿐이고
 * 나머지는 미확인이다. 운영자 행에는 등급이 없다.
 */
export const postAuthorTypes = ['GENERAL_MEMBER', 'MANAGER'] as const;
export type PostAuthorType = (typeof postAuthorTypes)[number];

/** 표의 `회원유형/회원등급` 오른쪽 값. frame 이 그린 것은 `일반회원` 하나뿐이다(미확인). */
export const postAuthorGrades = ['GENERAL_MEMBER'] as const;
export type PostAuthorGrade = (typeof postAuthorGrades)[number];

/**
 * 표의 `작성자` 셀: `이름(연락처)`. frame 은 APP 회원을 `김땡땡(your****@email.com)` 으로, 운영자를
 * `김담당(idididid123)` 으로 그린다 — 이메일은 마스킹된 값이고 아이디는 그대로다(CONTACT-MASKING).
 */
export interface PostAuthor {
  readonly name: string;
  /** APP 회원의 이메일. 목록은 마스킹해 그린다. */
  readonly email?: string;
  /** 운영자의 아이디. frame 은 마스킹 없이 그린다. */
  readonly accountId?: string;
}

/** 표의 `내용` 셀 아래 이미지 행. frame 은 회색 자리표시자 두 개를 그린다. */
export interface PostThumbnail {
  readonly id: string;
  readonly url: string;
}

/** Notion 35행: 기간 기준은 등록일·최근업데이트일이다(Case 정의 select 동일). */
export const postPeriodTypes = ['registeredAt', 'updatedAt'] as const;
export type PostPeriodType = (typeof postPeriodTypes)[number];

/** Case 정의 `검색어` 대상 select: 내용·제목 순서. 다중 키워드를 허용한다(Notion). */
export const postKeywordFields = ['content', 'title'] as const;
export type PostKeywordField = (typeof postKeywordFields)[number];

export interface PostKeyword {
  readonly field: PostKeywordField;
  readonly value: string;
}

/**
 * Case 정의 `정렬` 목록 14개, 화면 순서 그대로. `등록일` 이 굵게 그려진 기본값이고 Notion 도
 * `default : 등록일 or 마지막으로 설정한 값` 이라 적는다 — "마지막으로 설정한 값"의 보관은 미확인이라
 * 만들지 않는다. 표의 `카테고리`·`답변상태` 는 이 목록에 없어 정렬 축이 아니다.
 */
export const postSortKeys = [
  'registeredAt',
  'updatedAt',
  'category',
  'board',
  'title',
  'content',
  'member',
  'author',
  'likeCount',
  'dislikeCount',
  'rating',
  'commentCount',
  'viewCount',
  'status',
] as const;
export type PostSortKey = (typeof postSortKeys)[number];

export type PostSortDirection = 'asc' | 'desc';

/**
 * 표 한 행. frame 의 컬럼 순서대로 두었다. `-` 로 그려지는 자리는 선택값이다 — frame 이 카테고리·제목·
 * 좋아요·싫어요·평점·답변상태에서 실제로 `-` 를 그린다. 댓글·조회수는 모든 예시 행이 숫자라 필수로 둔다.
 */
export interface PostRow {
  readonly id: string;
  readonly category: PostCategory;
  readonly boardId: string;
  readonly boardName: string;
  /** 게시판이 소유한 카테고리 이름. 게시판이 카테고리를 쓰지 않으면 없다. */
  readonly boardCategoryName?: string;
  readonly title?: string;
  readonly content: string;
  readonly thumbnails: readonly PostThumbnail[];
  readonly authorType: PostAuthorType;
  readonly authorGrade?: PostAuthorGrade;
  readonly author: PostAuthor;
  readonly likeCount?: number;
  readonly dislikeCount?: number;
  readonly rating?: number;
  readonly commentCount: number;
  readonly viewCount: number;
  readonly answerStatus?: PostAnswerStatus;
  readonly status: PostStatus;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** 화면이 조립해 API 경계로 넘기는 조회 입력. 해소된 URL 값과 정확히 같은 값이 Query 키에도 들어간다. */
export interface PostListRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: PostSortKey;
  readonly sortDirection?: PostSortDirection;
  readonly periodType: PostPeriodType;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly PostKeyword[];
  readonly categories?: readonly PostCategory[];
  readonly boardId?: string;
  readonly memberType?: PostMemberType;
  readonly answerStatuses?: readonly PostAnswerStatus[];
  readonly statuses?: readonly PostStatus[];
}

export interface PostListPage {
  readonly rows: readonly PostRow[];
  readonly total: number;
}

/**
 * 검색 영역 `게시판` select 의 한 항목. Notion: `[게시판]에 등록된 게시판 중 [사용상태 : 사용]으로
 * 설정된 리스트 중 택1`. 목록이 서버에서 오므로 도메인 상수가 아니다.
 */
export interface PostBoardOption {
  readonly value: string;
  readonly label: string;
}

/**
 * 결과 toolbar 의 `선택 ▾` cascade. frame 이 그린 축은 `게시상태 >` 하나이고 leaf 는 게시·게시안함이다.
 * 축이 하나여도 축과 값을 같이 실어 두 번째 축이 생겨도 payload 모양이 바뀌지 않게 한다.
 */
export interface PostBulkChange {
  readonly field: 'status';
  readonly value: PostStatus;
}

/**
 * 표의 `작성자` 가 가리키는 회원. Notion: `작성자 → 회원 조회 버튼 → 클릭시, [회원 > 전체회원 > 회원 조회]
 * 중 해당 회원 페이지를 새탭으로 제공`. 운영자 작성자에는 그 목적지가 없다(frame 에도 버튼이 없다 — 미확인 6).
 */
export interface PostAuthorLink {
  readonly memberId?: string;
}

/**
 * 9.2.2 조회 frame 의 `피드백 정보 > 댓글` 표 한 행. 목록 표와 컬럼이 다르다 —
 * 카테고리·제목·내용·회원유형/회원등급·작성자·조회수·게시상태·등록일/최근업데이트일.
 */
export interface PostComment {
  readonly id: string;
  readonly boardCategoryName?: string;
  readonly title?: string;
  readonly content: string;
  readonly thumbnails: readonly PostThumbnail[];
  readonly authorType: PostAuthorType;
  readonly authorGrade?: PostAuthorGrade;
  readonly author: PostAuthor & PostAuthorLink;
  readonly viewCount: number;
  readonly status: PostStatus;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/**
 * 9.2.2 `업데이트 이력` 의 한 줄. frame 은 `등록` · `수정` · `댓글 등록` · `댓글 수정` 네 종류를 그리고,
 * 수정 계열에는 `- 게시상태 : 게시 > 게시안함` 처럼 항목·이전·이후를 덧붙인다.
 */
export const postChangeKinds = ['CREATE', 'UPDATE', 'COMMENT_CREATE', 'COMMENT_UPDATE'] as const;
export type PostChangeKind = (typeof postChangeKinds)[number];

export interface PostChange {
  readonly field: string;
  readonly before?: string;
  readonly after?: string;
}

export interface PostChangeLog {
  readonly id: string;
  readonly updatedAt: string;
  readonly kind: PostChangeKind;
  readonly changes: readonly PostChange[];
  readonly manager: string;
}

/**
 * 게시물 한 건의 조회 값 — 9.2.2 frame 의 `기본정보`·`피드백 정보`·`업데이트 이력` 이 그리는 것 전부.
 * 목록 행(PostRow)은 이 중 일부의 투영이다.
 */
export interface PostDetail {
  readonly id: string;
  readonly category: PostCategory;
  readonly boardId: string;
  readonly boardName: string;
  /** 게시판이 소유한 카테고리. 수정 폼이 같은 선택지에서 다시 고를 수 있도록 ID 도 싣는다. */
  readonly boardCategoryId?: string;
  readonly boardCategoryName?: string;
  readonly authorType: PostAuthorType;
  readonly authorGrade?: PostAuthorGrade;
  readonly author: PostAuthor & PostAuthorLink;
  /** frame `답변받을 이메일`. 마스킹된 값으로 그려진다. */
  readonly answerEmail?: string;
  readonly title?: string;
  readonly content: string;
  readonly thumbnails: readonly PostThumbnail[];
  readonly registeredAt: string;
  readonly updatedAt: string;
  readonly viewCount: number;
  readonly status: PostStatus;
  readonly likeCount?: number;
  readonly dislikeCount?: number;
  readonly rating?: number;
  readonly answerStatus?: PostAnswerStatus;
  readonly comments: readonly PostComment[];
  readonly changeLogs: readonly PostChangeLog[];
}

/**
 * 게시물 한 건이 가질 수 있는 구분. Figma 9.2.3.1 Case 정의의 `구분 *` select 가 일반·상담·공지사항을
 * 열거해 검색 영역의 두 개보다 넓다. 두 집합이 다른 이유는 원문이 그렇게 그리기 때문이며 좁은 쪽을
 * 넓히거나 넓은 쪽을 좁히지 않는다(게시판 쪽과 같은 관찰).
 */
export const postRecordCategories = ['GENERAL', 'COUNSEL', 'NOTICE'] as const;
export type PostRecordCategory = (typeof postRecordCategories)[number];

/** 등록·수정 frame 의 `카테고리 *` select 한 항목. 고른 게시판이 소유한 카테고리 목록에서 온다. */
export interface PostBoardCategoryOption {
  readonly value: string;
  readonly label: string;
}

/**
 * 게시물 등록·수정이 API 경계로 넘기는 입력. 폼의 문자열 초안이 아니라 도메인 값이다 —
 * `screens/post-form` 의 mapper 가 옮긴다. 서버 계약은 미확인이라 frame 이 확인한 항목만 담는다.
 */
export interface PostWriteInput {
  readonly category: PostRecordCategory;
  readonly boardId: string;
  readonly boardCategoryId?: string;
  readonly answerEmail?: string;
  readonly title: string;
  readonly content: string;
  /** frame 의 `등록일`. 날짜까지만 받는 현재 입력의 결과이며 시·분·초는 POST-FORM 의 보류다. */
  readonly registeredAt: string;
  readonly status: PostStatus;
}
