import type { MemberEditValues } from "../../../model/member-edit-values";
import type { MemberCreateValues } from "./member-create-schema";

// 등록·수정 확인창에서 확정한 입력을 받는다. 서버 계약 연결 전에는 저장하거나 dirty 상태를 지우지 않는다.
export const requestMemberCreate: (input: MemberCreateValues) => void = () => {
  console.log("[시나리오] 회원 등록: 요청 입력 확인 → API 연결 대기");
};

export const requestMemberEdit: (request: {
  memberId: string;
  input: MemberEditValues;
}) => void = () => {
  console.log("[시나리오] 회원 수정: 요청 입력 확인 → API 연결 대기");
};
