import type { ManagerDetailActionRequest } from "./manager-detail-actions";

// 각 상태에서 허용한 확인·입력 절차 이후의 요청 지점. 비밀번호·사유를 출력하거나 인증 성공을 만들지 않는다.
export function requestManagerDetail(request: ManagerDetailActionRequest) {
  const labels = {
    approve: "운영자 가입 승인",
    reject: "운영자 가입 거절",
    delete: "운영자 삭제",
    activate: "운영자 활성화",
    deactivate: "운영자 비활성화",
    password: "운영자 비밀번호 변경",
    unlock: "운영자 잠금해제",
    reveal: "운영자 개인정보 조회 재인증",
    verifyWithdrawal: "운영자 탈퇴 재인증",
  } satisfies Record<ManagerDetailActionRequest["type"], string>;
  console.log(
    "[시나리오] " + labels[request.type] + ": 요청 입력 확인 → API 연결 대기",
  );
}
