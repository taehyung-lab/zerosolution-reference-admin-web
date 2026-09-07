import type { MemberListActionRequest } from "../../../model/member-list-action";

// 선택 대상과 변경값을 확인한 뒤 호출한다. 실제 일괄변경·선택 해제·성공 알림은 API 연결 이후의 책임이다.
export const requestMemberBulkChange: (
  request: Extract<MemberListActionRequest, { type: "bulkChange" }>,
) => void = () => {
  console.log("[시나리오] 회원 일괄변경: 요청 입력 확인 → API 연결 대기");
};
