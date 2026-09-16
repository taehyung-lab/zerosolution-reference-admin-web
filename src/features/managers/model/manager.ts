/**
 * 11.1 운영자(설정 > 운영자)의 도메인 값. 목록 검색 조건·정렬·컬럼과 상세 항목·액션·상태는 원장
 * (`docs/reference/zero-sol/11-settings.md` 11.1)과 Notion 원문이 열거한 화면 값만 담는다.
 *
 * TRANSPLANT_PENDING_MANAGER_CONTRACT: 서버 enum·wire 값·유형/권한 옵션의 출처·페이지 응답 모양은
 * 미확인이다(신규 Admin OpenAPI 없음). 계약이 확정되면 이 목록과 요청 입력을 함께 교체한다.
 */

/** Notion에서 확인한 제품 계정 상태. 대기·거절·활성·비활성·잠금. */
export const managerAccountStatuses = ['awaiting', 'rejected', 'active', 'inactive', 'locked'] as const;
export type ManagerAccountStatus = (typeof managerAccountStatuses)[number];

/** 가입경로. 관리자 등록(WEB)과 앱 가입(APP). */
export const managerRegistrationRoutes = ['WEB', 'APP'] as const;
export type ManagerRegistrationRoute = (typeof managerRegistrationRoutes)[number];

/** 기간 기준은 가입일·최근접속일이다. */
export const managerPeriodTypes = ['joinedAt', 'lastAccessAt'] as const;
export type ManagerPeriodType = (typeof managerPeriodTypes)[number];

/** 검색어 대상 4개(아이디·이름·휴대폰번호·이메일). 다중 키워드 허용. */
export const managerKeywordFields = ['id', 'name', 'phone', 'email'] as const;
export type ManagerKeywordField = (typeof managerKeywordFields)[number];

export interface ManagerKeyword {
  readonly field: ManagerKeywordField;
  readonly value: string;
}

/** Figma 11.1 table 컬럼과 같은 집합의 정렬 키. 목록 테스트가 보기 정렬 목록과 헤더의 집합 일치를 본다. */
export const managerSortKeys = [
  'joinedAt',
  'lastAccessAt',
  'type',
  'organization',
  'id',
  'name',
  'phone',
  'email',
  'permission',
  'registrationRoute',
  'accountStatus',
] as const;
export type ManagerSortKey = (typeof managerSortKeys)[number];

/** 유형·권한처럼 서버가 목록으로 주는 선택지 하나. `value` 는 요청에 싣는 식별자, `label` 은 화면 어휘다. */
export interface ManagerOption {
  readonly value: string;
  readonly label: string;
}

/** Figma 11.1 table 의 행. 유형·권한은 라벨로 온다. */
export interface ManagerRow {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly organization: string;
  readonly phone: string;
  readonly email: string;
  readonly permission: string;
  readonly registrationRoute: ManagerRegistrationRoute;
  readonly accountStatus: ManagerAccountStatus;
  readonly joinedAt: string;
  readonly lastAccessAt: string;
}

/** 화면이 조립해 API 경계로 넘기는 조회 입력. 해소된 URL 값과 정확히 같은 값이 Query 키에도 들어간다. */
export interface ManagerListRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: ManagerSortKey;
  readonly sortDirection: 'asc' | 'desc';
  readonly periodType: ManagerPeriodType;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly ManagerKeyword[];
  readonly types?: readonly string[];
  readonly permission?: string;
  readonly statuses?: readonly ManagerAccountStatus[];
  readonly registrationRoutes?: readonly ManagerRegistrationRoute[];
}

export interface ManagerListPage {
  readonly rows: readonly ManagerRow[];
  readonly total: number;
}

/** 업데이트 내역의 변경 한 줄. field 는 `ManagerDetail` 의 키다. 실제 changeLog DTO 는 미확인이다. */
export interface ManagerChange {
  readonly field: string;
  readonly before?: string;
  readonly after?: string;
}

export interface ManagerChangeLog {
  readonly id: string;
  readonly updatedAt: string;
  readonly kind: 'CREATE' | 'UPDATE' | 'DELETE';
  readonly changes: readonly ManagerChange[];
  readonly manager: string;
}

/** 조회 화면이 보여 주는 값: 운영자정보 전부 + 업데이트 내역. 목록 행은 이 중 일부의 투영이다. */
export interface ManagerDetail {
  readonly id: string;
  readonly name: string;
  readonly type: ManagerOption;
  readonly permission: ManagerOption;
  readonly organization: string;
  readonly phone: string;
  readonly email: string;
  readonly registrationRoute: ManagerRegistrationRoute;
  readonly accountStatus: ManagerAccountStatus;
  /** 거절 상태의 사유. 다른 상태에는 없다. */
  readonly statusReason?: string;
  readonly joinedAt: string;
  readonly lastAccessAt: string;
  readonly changeLogs: readonly ManagerChangeLog[];
}

/** 등록·수정 frame `운영자정보` 섹션의 저장 항목. 유형·권한은 식별자로 보낸다. */
export interface ManagerSettings {
  readonly type: string;
  readonly permissionId: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly organization: string;
}

/** 등록만 아이디·비밀번호를 더한다. 수정 frame 에는 두 필드가 없다. */
export interface ManagerCreateSettings extends ManagerSettings {
  readonly id: string;
  readonly password: string;
}

/** 상세 화면의 상태 액션. 확인만 받는 것과 입력을 받는 것이 있다. */
export type ManagerAction =
  | { readonly type: 'approve' | 'delete' | 'activate' | 'deactivate'; readonly managerId: string }
  | { readonly type: 'reject'; readonly managerId: string; readonly reason: string }
  | { readonly type: 'password' | 'unlock'; readonly managerId: string; readonly password: string }
  | { readonly type: 'reveal'; readonly managerId: string; readonly operatorPassword: string }
  | {
      readonly type: 'verifyWithdrawal';
      readonly managerId: string;
      readonly reason: string;
      readonly operatorPassword: string;
    };

/** 목록 toolbar 일괄변경. 원문은 대기·거절·잠금을 변경 대상에서 제외한다. */
export interface ManagerBulkChangeRequest {
  readonly targetIds: readonly string[];
  readonly accountStatus: 'active' | 'inactive';
}
