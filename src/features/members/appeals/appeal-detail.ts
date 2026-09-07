/**
 * 소명 상세의 저장된 레코드와 처리 입력 형태를 정의한다.
 * 실제 API의 상태 코드·첨부·알림 이력 응답과 대조할 화면 모델이며 서버 계약 자체는 아니다.
 */
import type { AppealRow } from "../model/member-records";

export interface AppealProcessing {
  readonly status: "waiting" | "reviewing" | "held" | "completed";
  readonly result: "waiting" | "completed" | "rejected";
  readonly reason: "" | "unclear" | "insufficient" | "other";
  readonly direct: string;
  readonly opinion: string;
}
export interface AppealRecord extends AppealRow {
  readonly birthDate: string;
  readonly joinedAt: string;
  readonly signupMethod: "direct";
  readonly application: string;
  readonly attachments: readonly { name: string; href: string }[];
  readonly processing: AppealProcessing;
  readonly notified: boolean;
}
