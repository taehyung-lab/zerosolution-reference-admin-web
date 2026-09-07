import type { MemberCounselRequest } from "./member-counsel-request";

// 상담 팝업의 입력·대상 검증 뒤 도달하는 요청 지점. 상담 내용·연락처·프린터 식별자는 로그에 담지 않는다.
export function requestMemberCounsel(request: MemberCounselRequest) {
  if (request.type === "reissue") {
    console.log(
      request.test
        ? "[시나리오] 티켓 테스트 발권: 요청 입력 확인 → API 연결 대기"
        : "[시나리오] 티켓 재발권: 요청 입력 확인 → API 연결 대기",
    );
    return;
  }
  const labels = {
    download: "회원상담 다운로드",
    create: "회원상담 등록",
    update: "회원상담 수정",
    delete: "회원상담 삭제",
  } satisfies Record<Exclude<MemberCounselRequest["type"], "reissue">, string>;
  console.log(
    "[시나리오] " + labels[request.type] + ": 요청 입력 확인 → API 연결 대기",
  );
}
