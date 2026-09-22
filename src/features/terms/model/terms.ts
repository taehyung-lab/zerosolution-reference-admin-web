/**
 * 11.2 약관의 도메인 값이다. 근거는 Figma `11.2.1. 약관 리스트`·`11.2.1.1. Case 정의`·`11.2.2. 약관 조회`·
 * `11.2.3. 약관 등록`·`11.2.4. 약관 수정` frame(2026-09-22 aside 실측, 100% 렌더 판독)과 Notion 원문
 * 「약관 리스트를 조회할 수 있다」·「약관정보를 조회할 수 있다」·「약관을 등록할 수 있다」
 * (`docs/reference/zero-sol/notion/11-settings.md` 의 `설정 > 약관` 절)이다.
 * 제품 사실은 `product/facts/TERMS-LIST.md`·`TERMS-DETAIL.md`·`TERMS-FORM.md` 가 소유하고 여기에는
 * 그 값의 코드 표현만 둔다.
 *
 * TRANSPLANT_PENDING_TERMS_CONTRACT: 서버 enum·wire 값·정렬 키·페이지 응답 모양은 미확인이다
 * (Admin OpenAPI 없음). 계약이 확정되면 이 목록과 아래 요청 입력을 함께 교체한다.
 */

/** Case 정의 `기간` 기준 select: 등록일 · 최근업데이트일 · 시행일 · 게시일(Notion 35행 동일). */
export const termsPeriodTypes = ['registeredAt', 'updatedAt', 'effectiveAt', 'publishedAt'] as const;
export type TermsPeriodType = (typeof termsPeriodTypes)[number];

/**
 * Case 정의 `검색어` 대상 select: 본문 · 내용(Notion `검색어 : 본문, 내용`). 다중 키워드를 허용한다.
 * `내용` 이 어떤 값을 가리키는지는 미확인이다 — 등록·수정 frame 에는 `본문 *` 입력 하나뿐이고
 * 조회 frame 도 `본문` 한 줄만 그린다(TERMS-LIST 미확인 2).
 */
export const termsKeywordFields = ['body', 'content'] as const;
export type TermsKeywordField = (typeof termsKeywordFields)[number];

export interface TermsKeyword {
  readonly field: TermsKeywordField;
  readonly value: string;
}

/**
 * Case 정의 `게시 상태` : 전체 | 게시 · 게시안함 다중선택(Notion `게시 상태 → default : 전체`).
 * 같은 값을 등록·수정의 `게시 상태 *` select 와 조회의 상태 전환 버튼도 쓴다.
 */
export const termsStatuses = ['PUBLISHED', 'UNPUBLISHED'] as const;
export type TermsStatus = (typeof termsStatuses)[number];

/**
 * Case 정의 `정렬` 목록 7개, 화면 순서 그대로. `등록일` 이 굵게 그려진 기본값이고 Notion 도
 * `default : 등록일 or 마지막으로 설정한 값` 이라 적는다 — "마지막으로 설정한 값"의 보관은 미확인이라
 * 만들지 않는다.
 */
export const termsSortKeys = [
  'registeredAt',
  'updatedAt',
  'effectiveAt',
  'publishedAt',
  'version',
  'body',
  'status',
] as const;
export type TermsSortKey = (typeof termsSortKeys)[number];

export type TermsSortDirection = 'asc' | 'desc';

/**
 * 표 한 행. frame 의 컬럼 순서대로 두었다 — 버전 · 본문 · 시행일 · 게시 상태 · 게시일 ·
 * `등록일/최근업데이트일`. 예시 행에 빈 값이 하나도 없어 선택값을 두지 않는다.
 *
 * `version` 은 숫자와 점만 담는다(Notion `버전 → 입력가능문자 : 숫자, 점(.)`). 화면이 `V` 를 붙여 그린다.
 */
export interface TermsRow {
  readonly id: string;
  readonly version: string;
  readonly body: string;
  readonly effectiveAt: string;
  readonly status: TermsStatus;
  readonly publishedAt: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** 화면이 조립해 API 경계로 넘기는 조회 입력. 해소된 URL 값과 정확히 같은 값이 Query 키에도 들어간다. */
export interface TermsListRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: TermsSortKey;
  readonly sortDirection?: TermsSortDirection;
  readonly periodType: TermsPeriodType;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly TermsKeyword[];
  readonly statuses?: readonly TermsStatus[];
}

export interface TermsListPage {
  readonly rows: readonly TermsRow[];
  readonly total: number;
}

/**
 * 결과 toolbar 의 `선택 ▾` cascade. frame 이 그린 축은 `게시 상태 >` 하나이고 leaf 는 게시·게시안함이다.
 * 축이 하나여도 축과 값을 같이 실어 두 번째 축이 생겨도 payload 모양이 바뀌지 않게 한다.
 */
export interface TermsBulkChange {
  readonly field: 'status';
  readonly value: TermsStatus;
}

/**
 * 11.2.2 조회 frame 의 `업데이트 이력` 한 줄 — `업데이트일` · `업데이트 사항` · `담당자` 3열.
 * frame 이 그린 사항은 `등록` 하나뿐이고, Notion 은 `업데이트일 : 수정되어 저장된 날짜` 라 적어
 * 수정도 이 표에 쌓인다는 것까지 말한다. 그 밖의 종류와 항목별 변경 줄은 미확인이다
 * (TERMS-DETAIL 미확인 2).
 */
export const termsChangeKinds = ['CREATE', 'UPDATE'] as const;
export type TermsChangeKind = (typeof termsChangeKinds)[number];

export interface TermsChangeLog {
  readonly id: string;
  readonly updatedAt: string;
  readonly kind: TermsChangeKind;
  readonly manager: string;
}

/**
 * 약관 한 건의 조회 값 — 11.2.2 frame 의 `기본정보`·`업데이트 이력` 이 그리는 것 전부.
 * 목록 행(TermsRow)은 이 중 일부의 투영이다.
 */
export interface TermsDetail {
  readonly id: string;
  readonly version: string;
  readonly effectiveAt: string;
  readonly status: TermsStatus;
  readonly publishedAt: string;
  readonly body: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
  readonly changeLogs: readonly TermsChangeLog[];
}

/**
 * 약관 등록·수정이 API 경계로 넘기는 입력. 폼의 문자열 초안이 아니라 도메인 값이다 —
 * `screens/terms-form` 의 mapper 가 옮긴다. 서버 계약은 미확인이라 frame 이 확인한 항목만 담는다.
 */
export interface TermsWriteInput {
  readonly version: string;
  /** frame 의 `시행일`. 날짜까지만 받는 현재 입력의 결과이며 시·분·초는 TERMS-FORM 의 보류다. */
  readonly effectiveAt: string;
  readonly status: TermsStatus;
  /** frame 의 `게시일`. 시·분·초 보류는 시행일과 같다. */
  readonly publishedAt: string;
  readonly body: string;
}
