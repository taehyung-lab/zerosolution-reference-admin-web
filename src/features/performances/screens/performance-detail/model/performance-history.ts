import type { TFunction } from 'i18next';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import type { UpdateHistoryEntry } from '@/shared/ui/detail/UpdateHistory';
import type { PerformanceHistory } from '@/features/performances/model/performance-detail';

/**
 * 공연 업데이트 내역을 공용 UpdateHistory 가 표시할 행으로 옮긴다. 확인한 도면 파일명 외에는 원본 코드·JSON·
 * 개인정보를 표시하지 않는다. 서버의 이력 항목별 계약 확정 후 확장한다.
 */
export function toPerformanceHistoryEntries(
  history: readonly PerformanceHistory[],
  t: TFunction<'performances'>,
): readonly UpdateHistoryEntry[] {
  return history.map((entry) => ({
    id: entry.id,
    date: `${formatDate(entry.occurredAt)} ${formatTimeInTimeZone(entry.occurredAt, displayTimeZone(), 'second')}`,
    actor: entry.operator ? `${entry.operator.name} (${entry.operator.account})` : t('detail.emptyValue'),
    lines: [
      t('detail.edit'),
      ...entry.changes.map((change) => {
        if (change.field !== 'drawing') return t('detail.historyChange');
        const label = t('detail.drawing');
        const before = change.before == null ? t('detail.emptyValue') : change.before;
        const after = change.after == null ? t('detail.emptyValue') : change.after;
        if (typeof before !== 'string' || typeof after !== 'string' || before === after) return label;
        return t('detail.historyLine', { field: label, before, after });
      }),
    ],
  }));
}
