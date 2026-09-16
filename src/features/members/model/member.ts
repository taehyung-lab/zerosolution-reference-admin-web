/**
 * 4.1 활성 회원(전체·일반·불량)과 4.2 회원 조회·등록·수정의 도메인 값. 목록 검색 조건·정렬·컬럼과 상세 항목·액션은
 * 원장(`docs/reference/zero-sol/04-members.md`)이 열거한 화면 값만 담는다.
 *
 * TRANSPLANT_PENDING_MEMBER_CONTRACT: 서버 enum·wire 값·페이지 응답 모양은 미확인이다(회원 Admin OpenAPI 없음).
 * 계약이 확정되면 이 목록과 요청 입력을 함께 교체한다.
 */

export const memberAccountStatuses = ['general', 'flagged'] as const;
export type MemberAccountStatus = (typeof memberAccountStatuses)[number];

export const memberSignupMethods = ['direct', 'kakao', 'naver', 'apple', 'melon'] as const;
export type MemberSignupMethod = (typeof memberSignupMethods)[number];

/** 불량회원의 활동제한. 소명 화면은 이 중 입장제한을 제외한 둘만 다룬다. */
export const memberRestrictions = ['specialContent', 'inquiry', 'entry'] as const;
export type MemberRestriction = (typeof memberRestrictions)[number];

export const memberPeriodTypes = ['joinedAt', 'lastAccessedAt'] as const;
export type MemberPeriodType = (typeof memberPeriodTypes)[number];

export const memberKeywordFields = ['email', 'name', 'phone'] as const;
export type MemberKeywordField = (typeof memberKeywordFields)[number];

export interface MemberKeyword {
  readonly field: MemberKeywordField;
  readonly value: string;
}

/** 목록 table 의 정렬 가능한 컬럼과 같은 집합. 등급·계정 상태·활동제한은 표시만 한다. */
export const memberSortKeys = ['joinedAt', 'lastAccessedAt', 'signupMethod', 'email', 'name', 'phone'] as const;
export type MemberSortKey = (typeof memberSortKeys)[number];

/** 세 route 가 같은 목록 화면을 다른 정의로 연다. 요청은 정의가 고정한 계정 상태로 좁혀진다. */
export type MemberListVariant = 'all' | 'general' | 'flagged';

/** 목록 행과 조회·수정 화면이 같이 읽는 회원 한 명. 마스킹·라벨·시각 표시는 컬럼과 화면이 만든다. */
export interface MemberProfile {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly birthDate: string;
  readonly phone: string;
  readonly accountStatus: MemberAccountStatus;
  readonly restrictions: readonly MemberRestriction[];
  readonly joinedAt: string;
  readonly lastAccessedAt: string;
  readonly signupMethod: MemberSignupMethod;
}

/** 화면이 조립해 API 경계로 넘기는 조회 입력. 해소된 URL 값이 정의를 거쳐 여기로 오고 Query 키에도 같은 값이 들어간다. */
export interface MemberListRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: MemberSortKey;
  readonly sortDirection: 'asc' | 'desc';
  readonly periodType: MemberPeriodType;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly MemberKeyword[];
  readonly signupMethods?: readonly MemberSignupMethod[];
  readonly accountStatuses?: readonly MemberAccountStatus[];
  readonly restrictions?: readonly MemberRestriction[];
}

export interface MemberListPage {
  readonly rows: readonly MemberProfile[];
  readonly total: number;
}

/** 수정 frame 의 저장 항목. 일반회원은 활동제한을 비워 보낸다. */
export interface MemberSettings {
  readonly name: string;
  readonly birthDate: string;
  readonly phone: string;
  readonly accountStatus: MemberAccountStatus;
  readonly restrictions: readonly MemberRestriction[];
}

/** 등록 frame 의 저장 항목. 이메일·비밀번호는 등록에만 있고 계정 상태는 서버가 정한다. */
export interface MemberCreateSettings {
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly birthDate: string;
  readonly phone: string;
}

/** 상세 화면의 입력 액션. 비밀번호 확인과 재인증 성공 여부는 서버가 판정한다. */
export type MemberDetailAction =
  | { readonly type: 'password'; readonly memberId: string; readonly password: string }
  | { readonly type: 'reveal'; readonly memberId: string; readonly operatorPassword: string }
  | {
      readonly type: 'verifyWithdrawal';
      readonly memberId: string;
      readonly reason: string;
      readonly operatorPassword: string;
    };

/**
 * 일괄변경의 종속 선택을 하나의 값으로 둔다. 일반회원은 활동제한을 갖지 않으므로 그 조합을 표현할 수 없고,
 * 대상을 바꾸면 두 번째 단계가 구조적으로 사라진다. 활성 회원 목록과 소명 목록이 같은 값을 쓴다.
 */
export type MemberBulkChange =
  | { readonly accountStatus: 'general' }
  | { readonly accountStatus: 'flagged'; readonly restrictions: readonly MemberRestriction[] };

/** 불량회원은 활동제한을 하나 이상 골라야 완성된 변경값이다. */
export function completedBulkChange(change: MemberBulkChange | null): MemberBulkChange | undefined {
  if (change === null) return undefined;
  if (change.accountStatus === 'flagged' && change.restrictions.length === 0) return undefined;
  return change;
}

export interface MemberBulkChangeRequest {
  readonly targetIds: readonly string[];
  readonly accountStatus: MemberAccountStatus;
  readonly restrictions: readonly MemberRestriction[];
}

/** 발송에 필요한 최소 사실. 목록 셀의 마스킹 값에서 되돌리지 않고 이미 조회한 행에서 읽는다. */
export interface MemberContact {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}

export type MemberMessageChannel = 'sms' | 'email';

export interface MemberMessageTarget {
  readonly name: string;
  readonly address: string;
}

/** 선택한 ID 중 조회된 연락처가 있는 대상만 수신자다. 조회되지 않은 ID 는 주소를 지어내지 않고 제외한다. */
export function memberMessageRecipients(
  contacts: readonly MemberContact[],
  channel: MemberMessageChannel,
  ids: readonly string[],
): readonly MemberMessageTarget[] {
  return ids.flatMap((id) => {
    const contact = contacts.find((candidate) => candidate.id === id);
    return contact === undefined
      ? []
      : [{ name: contact.name, address: channel === 'sms' ? contact.phone : contact.email }];
  });
}

/** 다운로드는 선택한 행 또는 확정한 검색 조건 전체를 대상으로 한다. 파일 endpoint 는 미확인이다. */
export type MemberDownloadRequest<TSearch> =
  | { readonly scope: 'selected'; readonly ids: readonly string[] }
  | { readonly scope: 'all'; readonly search: TSearch };
