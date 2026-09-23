/**
 * 7.1 전시 > 배너의 도메인 값이다. 근거는 Figma `7.1.1.1. 배너 리스트`·`7.1.1.1.1. Case 정의`·
 * `7.1.2. 배너 조회`·`7.1.3. 배너 등록`·`7.1.3.1. Case 정의`·`7.1.4. 배너 수정`·`7.1.5.1. 팝업 : 미리보기`
 * frame(2026-09-23 aside 실측)과 Notion 원문 「배너 리스트를 조회할 수 있다」·「배너정보를 조회할 수
 * 있다」·「배너를 등록할 수 있다」(`docs/reference/zero-sol/notion/07-exhibition.md` 의 `전시 > 배너` 절)다.
 * 제품 사실은 `product/facts/BANNER-LIST.md`·`BANNER-DETAIL.md`·`BANNER-FORM.md` 가 소유하고 여기에는
 * 그 값의 코드 표현만 둔다.
 *
 * TRANSPLANT_PENDING_BANNER_CONTRACT: 서버 enum·wire 값·정렬 키·페이지 응답 모양은 미확인이다
 * (Admin OpenAPI 없음). 계약이 확정되면 이 목록과 아래 요청 입력을 함께 교체한다.
 */

/** Case 정의 `기간` 기준 select: 등록일 · 최근업데이트일 · 게시일(Notion `기간 : 등록일, 최근업데이트일, 게시일`). */
export const bannerPeriodTypes = ['registeredAt', 'updatedAt', 'postedAt'] as const;
export type BannerPeriodType = (typeof bannerPeriodTypes)[number];

/** Case 정의 `검색어` 대상 select: 배너명 하나(Notion `검색어 : 배너명`, 다중 키워드 허용). */
export const bannerKeywordFields = ['name'] as const;
export type BannerKeywordField = (typeof bannerKeywordFields)[number];

export interface BannerKeyword {
  readonly field: BannerKeywordField;
  readonly value: string;
}

/**
 * `구분`. 검색 영역·등록 select·표·조회가 모두 `홈` 하나만 그린다. Notion 은 검색 영역의
 * `구분 → default : 홈` 과 등록의 `구분 → 필수선택, 직접선택` 을 적는다.
 */
export const bannerCategories = ['HOME'] as const;
export type BannerCategory = (typeof bannerCategories)[number];

/** `이동경로 유형`: APP 내부 · 외부 경로. 검색 영역은 앞에 `전체` 를 두고, 등록 Case 정의 select 는 둘만 연다. */
export const bannerLinkTypes = ['APP', 'EXTERNAL'] as const;
export type BannerLinkType = (typeof bannerLinkTypes)[number];

/**
 * `게시 상태`: 대기 · 게시중 · 종료. 검색 영역·결과 toolbar cascade·등록 Case 정의·수정 select 가 같은
 * 세 값을 그리고 Notion 수정 원문도 `대기, 게시중, 종료 중 택1` 이다. Notion 목록 원문의 `중단` 은
 * 이 셋 중 무엇인지 미확인이다(BANNER-LIST 미확인 3).
 */
export const bannerStatuses = ['WAITING', 'POSTING', 'ENDED'] as const;
export type BannerStatus = (typeof bannerStatuses)[number];

/**
 * Case 정의 `정렬` 목록 9개, 화면 순서 그대로. `등록일` 이 굵게 그려진 기본값이고 Notion 도
 * `default : 등록일 or 마지막으로 설정한 값` 이다. "마지막으로 설정한 값"의 보관과, 같은 원문의
 * `게시순서 기준으로 정렬됨 → 1순위 숫자 오름차순, 2순위 등록일 내림차순` 이 이 기본값과 어떻게
 * 맞물리는지는 미확인이다(BANNER-LIST 미확인 1).
 */
export const bannerSortKeys = [
  'registeredAt',
  'updatedAt',
  'postStartAt',
  'postEndAt',
  'order',
  'category',
  'name',
  'linkType',
  'status',
] as const;
export type BannerSortKey = (typeof bannerSortKeys)[number];

export type BannerSortDirection = 'asc' | 'desc';

/**
 * 표 한 행. frame 의 컬럼 순서대로 두었다 — 게시순서 · 구분 · 배너명 · 이동경로 유형 · 게시기간 ·
 * 게시 상태 · `등록일/최근업데이트일`. 예시 행에 빈 값이 하나도 없어 선택값을 두지 않는다.
 */
export interface BannerRow {
  readonly id: string;
  readonly order: number;
  readonly category: BannerCategory;
  readonly name: string;
  readonly linkType: BannerLinkType;
  readonly postStartAt: string;
  readonly postEndAt: string;
  readonly status: BannerStatus;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** 화면이 조립해 API 경계로 넘기는 조회 입력. 해소된 URL 값과 정확히 같은 값이 Query 키에도 들어간다. */
export interface BannerListRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: BannerSortKey;
  readonly sortDirection?: BannerSortDirection;
  readonly periodType: BannerPeriodType;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly BannerKeyword[];
  readonly categories?: readonly BannerCategory[];
  readonly linkTypes?: readonly BannerLinkType[];
  readonly statuses?: readonly BannerStatus[];
}

export interface BannerListPage {
  readonly rows: readonly BannerRow[];
  readonly total: number;
}

/**
 * 결과 toolbar 의 `선택 ▾` cascade. Case 정의가 그린 축은 `게시 상태 >` 하나이고 leaf 는 대기·게시중·종료다.
 * 축이 하나여도 축과 값을 같이 실어 두 번째 축이 생겨도 payload 모양이 바뀌지 않게 한다.
 */
export interface BannerBulkChange {
  readonly field: 'status';
  readonly value: BannerStatus;
}

/** 이미지 파일 하나. 조회의 파일명 링크(클릭시 로컬 다운로드)와 미리보기 팝업이 같은 값을 쓴다. */
export interface BannerImage {
  readonly name: string;
  readonly url: string;
}

/**
 * 미리보기 팝업(7.1.5.1)이 세로로 쌓는 배너 한 장. Notion `현재 APP에 게시 중인 배너 조회` —
 * 선택 행이 아니라 APP 에 지금 노출되는 배너 전체다.
 */
export interface BannerPreviewItem {
  readonly id: string;
  readonly name: string;
  readonly image: BannerImage;
}

/**
 * 7.1.2 조회 frame 의 `업데이트 이력` 한 줄 — `업데이트일` · `업데이트 사항` · `담당자` 3열.
 * frame 은 `수정` 아래에 `- 게시순서 : 10 > 1` 처럼 항목별 이전 > 이후 줄을 쌓고, `등록` 은 한 낱말이다.
 */
export const bannerChangeKinds = ['CREATE', 'UPDATE'] as const;
export type BannerChangeKind = (typeof bannerChangeKinds)[number];

/** frame 이 그린 변경 줄의 항목: 게시순서 · 배너명 · 이동경로 URL · 이미지. 다른 항목의 줄은 미확인이다. */
export const bannerChangeFields = ['order', 'name', 'linkUrl', 'image'] as const;
export type BannerChangeField = (typeof bannerChangeFields)[number];

export interface BannerFieldChange {
  readonly field: BannerChangeField;
  readonly before: string;
  readonly after: string;
}

export interface BannerChangeLog {
  readonly id: string;
  readonly updatedAt: string;
  readonly kind: BannerChangeKind;
  readonly changes: readonly BannerFieldChange[];
  readonly manager: string;
}

/**
 * 배너 한 건의 조회 값 — 7.1.2 frame 의 `기본정보`·`업데이트 이력` 이 그리는 것 전부.
 * 목록 행(BannerRow)은 이 중 일부의 투영이다.
 */
export interface BannerDetail extends BannerRow {
  readonly linkUrl: string;
  readonly image: BannerImage;
  readonly changeLogs: readonly BannerChangeLog[];
}

/**
 * 배너 등록·수정이 API 경계로 넘기는 입력. 폼의 문자열 초안이 아니라 도메인 값이다 —
 * `screens/banner-form` 의 mapper 가 옮긴다. 이미지는 새로 고른 파일이거나 기존 파일 유지 둘 중 하나다.
 * 업로드가 별도 요청인지 한 multipart 인지는 서버 계약이 없어 미확인이다(BANNER-FORM 미확인 2).
 */
export interface BannerWriteInput {
  readonly category: BannerCategory;
  readonly order: number;
  readonly name: string;
  readonly linkType: BannerLinkType;
  readonly linkUrl: string;
  readonly image: { readonly kind: 'selected'; readonly file: File } | { readonly kind: 'existing' };
  /** Notion `게시기간 → 시작 년월일~종료 년월일 선택`. 날짜까지만 받는다(`YYYY-MM-DD`). */
  readonly postStartDate: string;
  readonly postEndDate: string;
  readonly status: BannerStatus;
}
