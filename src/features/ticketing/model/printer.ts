/**
 * 6.7.1 스마트프린터(발권 > 부가기능)의 도메인 값이다. 목록 검색 조건·다중선택·toolbar 는 원장
 * (`docs/reference/zero-sol/06-ticketing.md` 6.7.1)과 Notion 원문(`notion/06-ticketing.md`
 * 「발권 > 부가기능 > 스마트프린터」)이, 조회·등록·수정의 항목과 정렬·컬럼 구성은 Figma
 * `6.7.1.1 리스트`·`6.7.1.1.1 Case 정의`·`6.7.1.2 조회`·`6.7.1.3 등록`(+Case)·`6.7.1.4 수정`
 * frame(2026-09-15 aside 렌더 실측)이 열거한 화면 값만 담는다.
 *
 * TRANSPLANT_PENDING_TICKETING_PRINTER_CONTRACT: 서버 enum·wire 값·정렬 키·페이지 응답 모양은
 * 미확인이다(신규 Admin OpenAPI 없음). 계약이 확정되면 이 목록과 아래 요청 입력을 함께 교체한다.
 */

/** Figma Case 정의 `상태`: 정상·고장·수리중 택1. 검색 영역은 여기에 `전체`(조건 없음)를 더한다. */
export const printerStatuses = ['NORMAL', 'BROKEN', 'REPAIR'] as const;
export type PrinterStatus = (typeof printerStatuses)[number];

/** Figma Case 정의 `용도`: 내부발권용·현장발권용 택1. */
export const printerPurposes = ['INTERNAL', 'EXTERNAL'] as const;
export type PrinterPurpose = (typeof printerPurposes)[number];

/** Figma Case 정의 `사용상태`: 사용·사용안함 택1. */
export const printerUsages = ['IN_USE', 'NOT_IN_USE'] as const;
export type PrinterUsage = (typeof printerUsages)[number];

/** 원문 「스마트프린터 리스트를 조회할 수 있다」: 기간 기준은 등록일·최근업데이트일이다. */
export const printerPeriodTypes = ['registeredAt', 'updatedAt'] as const;
export type PrinterPeriodType = (typeof printerPeriodTypes)[number];

/** 원문 검색어 대상 6개(기기명·시리얼번호·모델명·제조사·보관위치·조치사항). 다중 키워드 허용. */
export const printerKeywordFields = [
  'name',
  'serialNo',
  'model',
  'manufacturer',
  'location',
  'measures',
] as const;
export type PrinterKeywordField = (typeof printerKeywordFields)[number];

export interface PrinterKeyword {
  readonly field: PrinterKeywordField;
  readonly value: string;
}

/**
 * Figma Case 정의 `정렬` 목록의 순서다. frame 은 `네트워크`를 7번째로 함께 적지만 그 값의 출처가
 * 조회·등록·수정 frame 과 Notion 어디에도 없어 컬럼·정렬 축 모두 보류한다(미확인, 이 파일 밖에서 추측하지 않는다).
 */
export const printerSortKeys = [
  'registeredAt',
  'updatedAt',
  'name',
  'serialNo',
  'model',
  'manufacturer',
  'location',
  'status',
  'measures',
  'purchasedAt',
  'purpose',
  'usage',
] as const;
export type PrinterSortKey = (typeof printerSortKeys)[number];

export type PrinterSortDirection = 'asc' | 'desc';

/** Figma 등록 frame placeholder `기기명 (1~100자 내외)` · `시리얼번호 (1~100자 내외)` · `모델명 (100자 내외)`. */
export const PRINTER_NAME_MAX_LENGTH = 100;
export const PRINTER_SERIAL_NO_MAX_LENGTH = 100;
export const PRINTER_MODEL_MAX_LENGTH = 100;

/**
 * 등록·수정 frame `기본정보` 섹션의 항목 전부, 화면 순서대로.
 * 제조사·보관위치·조치사항의 글자수 제한은 두 원문 어디에도 없어 상한을 만들지 않는다.
 */
export interface PrinterSettings {
  readonly name: string;
  readonly serialNo: string;
  readonly model: string;
  readonly manufacturer: string;
  /** `YYYY-MM-DD`. 입력하지 않으면 빈 문자열이다. */
  readonly purchasedAt: string;
  readonly location: string;
  readonly status: PrinterStatus;
  readonly measures: string;
  readonly purpose: PrinterPurpose;
  readonly usage: PrinterUsage;
}

/** Figma 리스트 table 의 행. 컬럼 구성은 `printer-list-columns` 가 소유한다. */
export interface PrinterRow extends PrinterSettings {
  readonly id: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** 화면이 조립해 API 경계로 넘기는 조회 입력. 해소된 URL 값과 정확히 같은 값이 Query 키에도 들어간다. */
export interface PrinterListRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: PrinterSortKey;
  readonly sortDirection: PrinterSortDirection;
  readonly periodType: PrinterPeriodType;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly PrinterKeyword[];
  readonly statuses?: readonly PrinterStatus[];
  readonly purposes?: readonly PrinterPurpose[];
  readonly usages?: readonly PrinterUsage[];
}

export interface PrinterListPage {
  readonly rows: readonly PrinterRow[];
  readonly total: number;
}

/**
 * 업데이트 이력의 변경 한 줄. Figma 조회 frame 은 `업데이트 사항` 열에 `수정` 아래
 * `모델명 : ZERO > ZERO123456` 처럼 항목·이전 값·이후 값을 적는다. field 는 `PrinterSettings` 의 키다.
 * 실제 changeLog DTO 는 미확인이다.
 */
export interface PrinterChange {
  readonly field: string;
  readonly before?: string;
  readonly after?: string;
}

export interface PrinterChangeLog {
  readonly id: string;
  readonly updatedAt: string;
  /** Figma: `등록` 한 줄, 또는 `수정` + 변경 목록. */
  readonly kind: 'CREATE' | 'UPDATE';
  readonly changes: readonly PrinterChange[];
  readonly manager: string;
}

/** 조회 frame 이 보여 주는 값: 기본정보 전부 + 업데이트 이력. 목록 행은 이 중 일부의 투영이다. */
export interface PrinterDetail extends PrinterRow {
  readonly changeLogs: readonly PrinterChangeLog[];
}

/** 일괄변경 `선택 ▾` 의 cascade 두 축(Figma Case 정의): 용도 > · 사용상태 >. */
export type PrinterBulkChange =
  | { readonly field: 'purpose'; readonly value: PrinterPurpose }
  | { readonly field: 'usage'; readonly value: PrinterUsage };
