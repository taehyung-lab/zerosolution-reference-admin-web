/**
 * 활성 회원 테이블의 표시 행과 목록 액션 입력을 정의한다.
 * 행의 연락처는 마스킹된 표시값이므로 실제 발송 주소로 재사용할 수 있다고 가정하지 않는다. 서버 DTO 매핑은 별도다.
 */
/**
 * TRANSPLANT_PENDING_MEMBER_LIST_CONTRACT: 표시 전용 행이다.
 * 신규 계약의 안정적인 식별자와 마스킹된 표시값을 이 모델에 매핑해야 한다.
 */
export interface MemberListRow {
  readonly key: string;
  readonly grade: string;
  readonly signupMethod: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string;
  readonly accountStatus: string;
  readonly joinedAt: string;
  readonly lastAccessedAt: string;
  readonly restrictions: readonly string[];
  readonly selectable?: boolean;
}

/**
 * 목록에서 확인한 대상과 업무 입력이다. 서버 DTO는 계약 확정 후 별도로 매핑한다.
 * SMS·이메일은 작성창을 열고, 일괄변경은 requestMemberBulkChange에 연결한다.
 * TRANSPLANT_PENDING_MEMBER_LIST_ACTIONS: 현재 요청 도달 로그만 남기며 실제 회원 API 계약을 기다린다.
 */
export type MemberListActionRequest =
  | {
      readonly type: 'bulkChange';
      readonly targetIds: readonly string[];
      readonly values: {
        readonly accountStatus: 'general' | 'flagged';
        readonly restrictions: readonly string[];
      };
    }
  | { readonly type: 'sms' | 'email'; readonly targetIds: readonly string[] };
