/**
 * 회원 상세 표시와 수정 초기값이 소비하는 화면 모델이다.
 * 실제 API에서는 응답을 이 모델로 변환하거나 확인된 차이에 맞춰 조정한다. 예시 모델을 서버 계약으로 취급하지 않는다.
 */
import type { MemberEditValues } from "../form/member-edit-schema";

export interface MemberProfile {
  readonly id: string;
  readonly email: string;
  readonly values: MemberEditValues;
  readonly joinedAt: string;
  readonly lastAccessedAt: string;
  readonly signupMethod: "direct" | "kakao" | "naver" | "apple" | "melon";
}
