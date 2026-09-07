import type { MessageValues } from "../../../model/message";

export type MessageSendRequest = MessageValues & {
  readonly channel: "sms" | "email";
};

// SMS·이메일 작성 폼의 검증된 입력을 받는다. 정책 조회·발송 API 연결 전에는 수신자와 본문을 출력하지 않는다.
export function requestMessageSend(request: MessageSendRequest) {
  console.log(
    request.channel === "sms"
      ? "[시나리오] SMS 발송: 요청 입력 확인 → API 연결 대기"
      : "[시나리오] 이메일 발송: 요청 입력 확인 → API 연결 대기",
  );
}
