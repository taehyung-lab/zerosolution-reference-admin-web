/**
 * 서버 또는 예시 데이터의 instant를 회원 화면의 날짜·시간 표시로 바꾸는 함수다.
 * 실제 API에서도 표시 변환은 필요하며 timezone 계산은 공용 datetime 함수에 맡긴다.
 */
import {
  displayTimeZone,
  formatDate,
  formatTimeInTimeZone,
} from "@/shared/lib/datetime";

export function formatMemberInstant(instant: string) {
  return `${formatDate(instant)} ${formatTimeInTimeZone(instant, displayTimeZone())}`;
}
