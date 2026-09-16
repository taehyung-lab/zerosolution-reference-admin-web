/**
 * 4.3 휴면 · 4.4 탈퇴 · 4.5 회원접속 · 4.6 회원상담 · 4.7 불량회원 소명신청의 행·조회 입력·상세 값.
 * 다섯 목록은 서로 다른 행과 필드를 가지므로 각자의 요청 타입을 갖고, 공통 부분(페이지·정렬·기간·검색어)만 base 다.
 *
 * TRANSPLANT_PENDING_MEMBER_RECORDS_CONTRACT: 각 id 가 회원 ID 인지 기록 ID 인지, 서버 enum·정렬 어휘는 미확인이다.
 */
import type { MemberAccountStatus, MemberKeywordField, MemberRestriction, MemberSignupMethod } from './member';
import type { MemberCounselRecord } from './member-counsel';

interface RecordListRequest<TPeriod extends string, TSort extends string, TKeyword extends string> {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: TSort;
  readonly sortDirection: 'asc' | 'desc';
  readonly periodType: TPeriod;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly { readonly field: TKeyword; readonly value: string }[];
}

export interface RecordPage<TRow> {
  readonly rows: readonly TRow[];
  readonly total: number;
}

// ── 4.3 휴면회원 ────────────────────────────────────────────────────────────────

export const dormantPeriodTypes = ['joinedAt', 'lastAccessedAt', 'dormantAt'] as const;
export type DormantPeriodType = (typeof dormantPeriodTypes)[number];
export const dormantSortKeys = ['joinedAt', 'lastAccessedAt', 'dormantAt', 'signupMethod', 'email', 'name', 'phone'] as const;
export type DormantSortKey = (typeof dormantSortKeys)[number];

export interface DormantMemberRow {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string;
  readonly signupMethod: MemberSignupMethod;
  readonly accountStatus: MemberAccountStatus;
  readonly joinedAt: string;
  readonly lastAccessedAt: string;
  readonly dormantAt: string;
}

export interface DormantListRequest extends RecordListRequest<DormantPeriodType, DormantSortKey, MemberKeywordField> {
  readonly signupMethods?: readonly MemberSignupMethod[];
  readonly accountStatuses?: readonly MemberAccountStatus[];
}

// ── 4.4 탈퇴회원 ────────────────────────────────────────────────────────────────

export const withdrawnPeriodTypes = ['joinedAt', 'lastAccessedAt', 'withdrawnAt'] as const;
export type WithdrawnPeriodType = (typeof withdrawnPeriodTypes)[number];
export const withdrawnSortKeys = ['withdrawnAt', 'joinedAt', 'lastAccessedAt', 'signupMethod', 'email', 'name', 'phone'] as const;
export type WithdrawnSortKey = (typeof withdrawnSortKeys)[number];

/** 목록 행이자 탈퇴회원 조회의 값이다. 이름·휴대폰은 탈퇴 뒤 보이지 않는다. */
export interface WithdrawnMemberRow {
  readonly id: string;
  readonly email: string;
  readonly signupMethod: MemberSignupMethod;
  readonly accountStatus: MemberAccountStatus;
  readonly joinedAt: string;
  readonly lastAccessedAt: string;
  readonly withdrawnAt: string;
  readonly reason: string;
}

export interface WithdrawnListRequest extends RecordListRequest<WithdrawnPeriodType, WithdrawnSortKey, 'email'> {
  readonly signupMethods?: readonly MemberSignupMethod[];
  readonly accountStatuses?: readonly MemberAccountStatus[];
}

// ── 4.5 회원접속 ────────────────────────────────────────────────────────────────

export const accessPaths = ['app'] as const;
export type AccessPath = (typeof accessPaths)[number];
export const accessSortKeys = ['accessedAt', 'grade', 'email', 'name', 'phone', 'accountStatus', 'accessPath'] as const;
export type AccessSortKey = (typeof accessSortKeys)[number];

export interface MemberAccessRow {
  readonly id: string;
  readonly grade: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string;
  readonly accountStatus: MemberAccountStatus;
  readonly accessedAt: string;
  readonly accessPath: AccessPath;
}

export interface AccessListRequest extends RecordListRequest<'accessedAt', AccessSortKey, MemberKeywordField> {
  readonly accountStatuses?: readonly MemberAccountStatus[];
  readonly accessPaths?: readonly AccessPath[];
}

// ── 4.6 회원상담 ────────────────────────────────────────────────────────────────

export const counselPeriodTypes = ['receivedAt', 'answeredAt'] as const;
export type CounselPeriodType = (typeof counselPeriodTypes)[number];
export const counselStatuses = ['waiting', 'reviewing', 'completed'] as const;
export type CounselStatus = (typeof counselStatuses)[number];
export const counselKeywordFields = ['email', 'name', 'phone', 'content'] as const;
export type CounselKeywordField = (typeof counselKeywordFields)[number];
export const counselSortKeys = ['receivedAt', 'answeredAt', 'email', 'name', 'phone', 'inquiryType', 'content', 'status'] as const;
export type CounselSortKey = (typeof counselSortKeys)[number];

/** 상담 한 건(문의). 문의유형은 서버 옵션의 식별자다. */
export interface CounselRow {
  readonly id: string;
  readonly memberId: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string;
  readonly signupMethod: MemberSignupMethod;
  readonly accountStatus: MemberAccountStatus;
  readonly receivedAt: string;
  readonly answeredAt: string;
  readonly inquiryType: string;
  readonly content: string;
  readonly status: CounselStatus;
}

/** 목록 행을 클릭하면 열리는 팝업의 값: 문의 + 상담 기록 + 연결된 예매. */
export interface CounselDetail extends CounselRow {
  readonly records: readonly MemberCounselRecord[];
  readonly booking?: {
    readonly performance: string;
    readonly booking: string;
    readonly booker: string;
  };
}

export interface CounselListRequest extends RecordListRequest<CounselPeriodType, CounselSortKey, CounselKeywordField> {
  readonly signupMethods?: readonly MemberSignupMethod[];
  readonly accountStatuses?: readonly MemberAccountStatus[];
  readonly inquiryType?: string;
  readonly statuses?: readonly CounselStatus[];
}

/** 문의유형처럼 서버가 목록으로 주는 선택지 하나. */
export interface CounselOption {
  readonly value: string;
  readonly label: string;
}

export interface CounselPrinter {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly busy: boolean;
}

/** 재발권 팝업의 입력: 고를 수 있는 프린터와 미리보기. 실제 장비 연결·인쇄 성공은 여기서 알 수 없다. */
export interface CounselReissueInput {
  readonly printers: readonly CounselPrinter[];
  readonly preview: string;
}

export interface CounselReissueRequest {
  readonly counselId: string;
  readonly noteId: string;
  readonly printerId: string;
  readonly test: boolean;
}

// ── 4.7 불량회원 소명신청 ──────────────────────────────────────────────────────

export const appealPeriodTypes = ['appliedAt', 'flaggedAt'] as const;
export type AppealPeriodType = (typeof appealPeriodTypes)[number];
export const appealStatuses = ['waiting', 'reviewing', 'held', 'completed'] as const;
export type AppealStatus = (typeof appealStatuses)[number];
export const appealResults = ['waiting', 'completed', 'rejected'] as const;
export type AppealResult = (typeof appealResults)[number];
export const appealReasons = ['unclear', 'insufficient', 'other'] as const;
export type AppealReason = (typeof appealReasons)[number];
/** 소명 화면이 다루는 활동제한. 입장제한은 소명 대상이 아니다. */
export const appealRestrictions = ['specialContent', 'inquiry'] as const satisfies readonly MemberRestriction[];
export const appealSortKeys = ['appliedAt', 'flaggedAt', 'email', 'name', 'phone', 'restrictions'] as const;
export type AppealSortKey = (typeof appealSortKeys)[number];

export interface AppealRow {
  readonly id: string;
  readonly memberId: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string;
  readonly accountStatus: MemberAccountStatus;
  readonly appliedAt: string;
  readonly flaggedAt: string;
  readonly restrictions: readonly MemberRestriction[];
  readonly status: AppealStatus;
  readonly result: AppealResult;
}

/** 처리 결과 입력이자 저장된 값. 결과가 거절일 때만 사유가 뜻을 갖는다. */
export interface AppealProcessing {
  readonly status: AppealStatus;
  readonly result: AppealResult;
  readonly reason: '' | AppealReason;
  readonly direct: string;
  readonly opinion: string;
}

export interface AppealRecord extends AppealRow {
  readonly birthDate: string;
  readonly joinedAt: string;
  readonly signupMethod: MemberSignupMethod;
  readonly application: string;
  readonly attachments: readonly { readonly name: string; readonly href: string }[];
  readonly processing: AppealProcessing;
  readonly notified: boolean;
}

export interface AppealListRequest extends RecordListRequest<AppealPeriodType, AppealSortKey, MemberKeywordField> {
  readonly restrictions?: readonly MemberRestriction[];
  readonly statuses?: readonly AppealStatus[];
  readonly results?: readonly AppealResult[];
}
