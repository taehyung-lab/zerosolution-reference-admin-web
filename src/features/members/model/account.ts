/**
 * 회원 화면에서 사용하는 계정 상태·가입 방식·활동제한의 어휘다.
 * 화면 정책의 입력으로 유지하되 신규 서버 enum과 동일하다고 가정하지 않고 API 경계에서 대조한다.
 */
export const memberAccountStatuses = ["general", "flagged"] as const;
export const memberSignupMethods = [
  "direct",
  "kakao",
  "naver",
  "apple",
  "melon",
] as const;
export const memberRestrictions = [
  "specialContent",
  "inquiry",
  "entry",
] as const;
