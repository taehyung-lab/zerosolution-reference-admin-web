/**
 * 운영자 업데이트 내역을 공용 UpdateHistory 가 표시할 행으로 옮긴다. `업데이트 사항` 열은 `등록`·`삭제` 한 줄,
 * 또는 `수정` 아래 `항목: 이전 > 이후` 줄들이다. 날짜 표시·라벨·값 어휘를 이 feature 가 소유하고 3열 렌더는
 * 공용 표면이 소유한다. 비밀번호처럼 값이 화면에 나타나면 안 되는 항목은 변경 사실만 한 줄로 남긴다.
 */
import { formatDate } from '@/shared/lib/datetime';
import type { UpdateHistoryEntry } from '@/shared/ui/detail/UpdateHistory';
import type { TFunction } from 'i18next';
import type { ManagerChange, ManagerChangeLog } from '@/features/managers/model/manager';

/** 설정 키 → 화면 라벨 키. 여기 없는 키는 코드를 노출하지 않는 한 줄로 치환한다. */
const fieldLabelKeys: Readonly<Record<string, string>> = {
  name: 'fields.name',
  phone: 'fields.phone',
  email: 'fields.email',
  organization: 'fields.organization',
  type: 'fields.type',
  permission: 'fields.permission',
  accountStatus: 'fields.accountStatus',
  statusReason: 'detail.statusReason',
  password: 'form.password',
};

/** 값이 화면에 나타나면 안 되는 항목. 변경 사실만 남긴다. */
const redactedFields: ReadonlySet<string> = new Set(['password']);

function changeLine(change: ManagerChange, t: TFunction<'managers'>): string {
  const labelKey = fieldLabelKeys[change.field];
  if (labelKey === undefined) return t('detail.historyUnknownField');
  const label = t(labelKey);
  if (redactedFields.has(change.field)) return label;
  const show = (value: string | undefined) =>
    value === undefined || value === ''
      ? t('detail.emptyValue')
      : change.field === 'accountStatus'
        ? t(`accountStatus.${value}`, { defaultValue: value })
        : value;
  const before = show(change.before);
  const after = show(change.after);
  // 해석된 좌우가 같으면 `A > A` 가 버그로 읽히므로 서버가 변경이라 말한 사실(항목명)만 남긴다.
  if (before === after) return label;
  return t('detail.historyLine', { field: label, before, after });
}

export function toManagerHistoryEntries(
  logs: readonly ManagerChangeLog[],
  t: TFunction<'managers'>,
): readonly UpdateHistoryEntry[] {
  const empty = t('detail.emptyValue');
  return logs.map((log) => ({
    id: log.id,
    date: formatDate(log.updatedAt) || empty,
    lines:
      log.kind === 'CREATE'
        ? [t('detail.historyCreated')]
        : log.kind === 'DELETE'
          ? [t('detail.historyDeleted')]
          : [t('detail.historyUpdated'), ...log.changes.map((change) => changeLine(change, t))],
    actor: log.manager || empty,
  }));
}
