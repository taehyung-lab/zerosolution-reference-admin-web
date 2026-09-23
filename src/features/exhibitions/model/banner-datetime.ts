import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';

/**
 * 배너 frame 들이 일시를 그리는 한 가지 표기 `2026-06-01 12:00:00`(목록의 게시기간·등록일/최근업데이트일,
 * 조회의 게시기간·업데이트일). 하루 경계와 시각은 브라우저 zone 으로 읽는다. 빈 instant 는 빈 문자열이다.
 */
export function formatBannerDateTime(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone(), 'second')}`;
}
