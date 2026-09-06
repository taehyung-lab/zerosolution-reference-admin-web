import { formatDate } from '@/shared/lib/datetime';
import type { UpdateHistoryEntry } from '@/shared/ui/patterns/UpdateHistory';
import type { TFunction } from 'i18next';
import type { ManagerChangeLog, ManagerChangeLogChange } from '../api/manager-detail-contract';

type Translate = TFunction<'managers'>;

/** 서버 field 코드 → 이미 존재하는 화면 라벨 키. 여기 없는 field는 코드 대신 중립 문구로 접는다. */
const fieldLabelKeys: Readonly<Record<string, string>> = {
  name: 'detail.name',
  phone: 'detail.phone',
  email: 'detail.email',
  organization: 'detail.organization',
  type: 'detail.type',
  permission: 'detail.permission',
  permissionId: 'detail.permission',
  status: 'detail.status',
  statusReason: 'detail.statusReason',
  agency: 'form.agency',
  agencyId: 'form.agency',
  password: 'form.password',
};

/** 값이 화면에 나타나면 안 되는 field. 변경 사실만 한 줄로 남긴다. */
const redactedFields: ReadonlySet<string> = new Set(['password', 'passwordConfirm']);

/** before/after 를 표시 문자열로. 구조를 모르는 값은 null 을 돌려 호출부가 줄을 접게 한다. 원문 JSON은 노출하지 않는다. */
function formatValue(value: unknown, t: Translate): string | null {
  if (value === null || value === undefined || value === '') return t('detail.emptyValue');
  if (typeof value === 'boolean')
    return t(value ? 'detail.historyValue.true' : 'detail.historyValue.false');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object' && 'name' in value && typeof value.name === 'string')
    return value.name;
  return null;
}

function changeLine(change: ManagerChangeLogChange, t: Translate): string {
  const field = change.field ?? '';
  const labelKey = fieldLabelKeys[field];
  if (labelKey === undefined) return t('detail.historyUnknownField');
  const label = t(labelKey);
  if (redactedFields.has(field)) return label;
  const before = formatValue(change.before, t);
  const after = formatValue(change.after, t);
  if (before === null || after === null)
    return t('detail.historyLine.unsupported', { field: label });
  // 해석된 좌우가 같으면 `A > A`가 버그로 읽히므로 서버가 변경이라 말한 사실(필드명)만 남긴다.
  if (before === after) return label;
  return t('detail.historyLine.change', { field: label, before, after });
}

function lines(log: ManagerChangeLog, t: Translate): readonly string[] {
  if (log.type === 'C') return [t('detail.changeType.C')];
  if (log.type === 'D') return [t('detail.changeType.D')];
  if (log.type === 'U')
    return [
      t('detail.changeType.U'),
      ...(log.changes ?? []).map((change) => changeLine(change, t)),
    ];
  return [t('detail.changeType.unknown')];
}

export function toManagerHistoryEntries(
  logs: readonly ManagerChangeLog[] | undefined,
  t: Translate,
): readonly UpdateHistoryEntry[] {
  const empty = t('detail.emptyValue');
  return (logs ?? []).map((log, index) => ({
    // 리허설 DTO는 id를 optional로 선언한다. 실제 계약에서 필수로 확인되기 전까지의 방어이며 index만으로 키를 만들지 않는다.
    id: log.id === undefined ? `${log.createdAt ?? ''}#${index}` : String(log.id),
    date: formatDate(log.createdAt) || empty,
    lines: lines(log, t),
    manager: log.manager?.name ?? empty,
  }));
}
