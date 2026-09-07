import type { MemberActivityDelete } from "../../../model/member-activity";
import type { MemberDetailRequest } from "./member-detail-request";

// 활성·탈퇴 회원 상세가 같은 활동정보 삭제 입력을 사용한다. 대상 회원 ID를 활동 ID와 함께 연결한다.
export const requestMemberActivityDelete: (request: {
  memberId: string;
  input: MemberActivityDelete;
}) => void = () => {
  console.log(
    "[시나리오] 회원 활동정보 선택삭제: 요청 입력 확인 → API 연결 대기",
  );
};

// 재인증은 입력까지만 확인한다. 개인정보 공개·최종 탈퇴·상담 저장 성공을 가정하지 않는다.
export function requestMemberDetail(request: MemberDetailRequest) {
  if (request.kind === "deleteActivity") {
    requestMemberActivityDelete(request);
    return;
  }
  const labels = {
    password: "회원 비밀번호 변경",
    reveal: "회원 개인정보 조회 재인증",
    verifyWithdrawal: "회원 탈퇴 재인증",
    createCounsel: "회원 상세 상담 등록",
    updateCounsel: "회원 상세 상담 수정",
    deleteCounsel: "회원 상세 상담 삭제",
  } satisfies Record<
    Exclude<MemberDetailRequest["kind"], "deleteActivity">,
    string
  >;
  console.log(
    "[시나리오] " + labels[request.kind] + ": 요청 입력 확인 → API 연결 대기",
  );
}
