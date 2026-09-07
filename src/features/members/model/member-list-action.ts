/**
 * 목록에서 확인한 대상과 업무 입력이다. 서버 DTO는 계약 확정 후 별도로 매핑한다.
 * SMS·이메일은 작성창을 열고, 일괄변경은 requestMemberBulkChange에 연결한다.
 * TRANSPLANT_PENDING_MEMBER_LIST_ACTIONS: 현재 요청 도달 로그만 남기며 실제 회원 API 계약을 기다린다.
 */
export type MemberListActionRequest =
  | {
      readonly type: "bulkChange";
      readonly targetIds: readonly string[];
      readonly values: {
        readonly accountStatus: "general" | "flagged";
        readonly restrictions: readonly string[];
      };
    }
  | { readonly type: "sms" | "email"; readonly targetIds: readonly string[] };
