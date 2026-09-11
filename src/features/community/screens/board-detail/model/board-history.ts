/**
 * 게시판 변경 이력을 공용 UpdateHistory 가 표시할 행으로 옮긴다.
 * 날짜 표시와 빈 값 문구를 이 feature 가 소유하고, 3열 렌더는 공용 표면이 소유한다.
 */
import { formatDate } from '@/shared/lib/datetime';
import type { UpdateHistoryEntry } from '@/shared/ui/patterns/UpdateHistory';
import type { TFunction } from 'i18next';
import type { BoardChangeLog } from '@/features/community/model/board';

/**
 * 서버 field 코드 → 이미 화면에 있는 라벨 키. 여기 없는 코드는 코드를 그대로 노출하지 않고 접는다.
 * 실제 코드 집합은 미확인이라 이 표는 게시판 레코드가 가진 값만 담는다.
 */
const fieldLabelKeys: Readonly<Record<string, string>> = {
  category: 'board.columns.category',
  name: 'board.columns.name',
  writePermission: 'board.detail.writePermission',
  readPermission: 'board.detail.readPermission',
  usage: 'board.columns.usage',
};

export function toBoardHistoryEntries(
  logs: readonly BoardChangeLog[],
  t: TFunction<'community'>,
): readonly UpdateHistoryEntry[] {
  const empty = t('board.detail.emptyValue');
  const line = (field: string) => {
    const key = fieldLabelKeys[field];
    return key === undefined ? t('board.detail.historyUnknownField') : t(key);
  };
  return logs.map((log) => ({
    id: log.id,
    date: formatDate(log.updatedAt) || empty,
    lines: log.changes.length > 0 ? log.changes.map(line) : [empty],
    manager: log.manager || empty,
  }));
}
