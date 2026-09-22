/**
 * 약관 업데이트 이력(Figma 11.2.2 `업데이트 이력`)을 공용 UpdateHistory 가 표시할 행으로 옮긴다.
 * frame(2026-09-22 실측)의 `업데이트 사항` 열은 `등록` 한 낱말이고, Notion 은 업데이트일을
 * `수정되어 저장된 날짜` 라 적어 수정도 이 표에 쌓인다는 것까지 말한다. 항목별 `이전 > 이후` 줄은
 * 이 화면의 원문에 없으므로 만들지 않는다(TERMS-DETAIL 미확인 2).
 * 날짜 표시·라벨·값 어휘를 이 feature 가 소유하고, 3열 렌더는 공용 표면이 소유한다.
 */
import type { TFunction } from 'i18next';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import type { UpdateHistoryEntry } from '@/shared/ui/detail/UpdateHistory';
import type { TermsChangeLog } from '@/features/terms/model/terms';

const kindLabels = {
  CREATE: 'terms.detail.historyCreated',
  UPDATE: 'terms.detail.historyUpdated',
} as const;

/** frame 은 이력 일시를 `2026-06-01 12:12:11` 로 초까지 그린다. */
function historyDate(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone(), 'second')}`;
}

export function toTermsHistoryEntries(
  logs: readonly TermsChangeLog[],
  t: TFunction<'terms'>,
): readonly UpdateHistoryEntry[] {
  const empty = t('terms.columns.emptyValue');
  return logs.map((log) => ({
    id: log.id,
    date: historyDate(log.updatedAt) || empty,
    lines: [t(kindLabels[log.kind])],
    actor: log.manager || empty,
  }));
}
