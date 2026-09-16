/**
 * 스마트프린터 업데이트 이력(Figma 조회 frame 표기 `업데이트 이력`)을 공용 UpdateHistory 가 표시할
 * 행으로 옮긴다. frame 의 `업데이트 사항` 열은 `등록` 한 줄, 또는 `수정` 아래 `항목 : 이전 > 이후`
 * 줄들이다(`모델명 : ZERO > ZERO123456`, `제조사 : - > 국내`, `구매일 : 2025-06-01 > 2026-06-01`).
 * 날짜 표시·라벨·값 어휘를 이 feature 가 소유하고 3열 렌더는 공용 표면이 소유한다.
 */
import { formatDate } from '@/shared/lib/datetime';
import type { UpdateHistoryEntry } from '@/shared/ui/detail/UpdateHistory';
import type { TFunction } from 'i18next';
import type { PrinterChange, PrinterChangeLog } from '@/features/ticketing/model/printer';

/** 설정 키 → 화면 라벨 키. 여기 없는 키는 코드를 노출하지 않는 한 줄로 치환한다. */
const fieldLabelKeys: Readonly<Record<string, string>> = {
  name: 'printer.form.name',
  serialNo: 'printer.form.serialNo',
  model: 'printer.form.model',
  manufacturer: 'printer.form.manufacturer',
  purchasedAt: 'printer.form.purchasedAt',
  location: 'printer.form.location',
  status: 'printer.form.status',
  measures: 'printer.form.measures',
  purpose: 'printer.form.purpose',
  usage: 'printer.form.usage',
};

/** 값 코드 → 화면 어휘. 어휘 표에 없는 값(기기명·시리얼번호·날짜 등)은 그대로 보여 준다. */
const valueNamespaces: Readonly<Record<string, string>> = {
  status: 'printer.values.status',
  purpose: 'printer.values.purpose',
  usage: 'printer.values.usage',
};

function changeLine(change: PrinterChange, t: TFunction<'ticketing'>): string {
  const labelKey = fieldLabelKeys[change.field];
  if (labelKey === undefined) return t('printer.detail.historyUnknownField');
  const label = t(labelKey);
  const namespace = valueNamespaces[change.field];
  const show = (value: string | undefined) => {
    if (value === undefined || value === '') return t('printer.detail.emptyValue');
    if (namespace === undefined) return value;
    return t(`${namespace}.${value}`, { defaultValue: value });
  };
  return t('printer.detail.historyLine', {
    field: label,
    before: show(change.before),
    after: show(change.after),
  });
}

export function toPrinterHistoryEntries(
  logs: readonly PrinterChangeLog[],
  t: TFunction<'ticketing'>,
): readonly UpdateHistoryEntry[] {
  const empty = t('printer.detail.emptyValue');
  return logs.map((log) => ({
    id: log.id,
    date: formatDate(log.updatedAt) || empty,
    lines:
      log.kind === 'CREATE'
        ? [t('printer.detail.historyCreated')]
        : [
            t('printer.detail.historyUpdated'),
            ...log.changes.map((change) => changeLine(change, t)),
          ],
    actor: log.manager || empty,
  }));
}
