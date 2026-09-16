import { useState } from 'react';
import { useConfirmation } from '@/shared/model/use-confirmation';
import { useSelectionGate } from '@/shared/model/use-selection-gate';
import { useTranslation } from 'react-i18next';
import {
  printerPurposes,
  printerUsages,
  type PrinterBulkChange,
} from '@/features/ticketing/model/printer';

export interface PrinterBulkChangeRequest {
  readonly targetIds: readonly string[];
  readonly change: PrinterBulkChange;
}

export interface PrinterCopyRequest {
  readonly targetIds: readonly string[];
}

/**
 * Figma Case 정의의 cascade `선택 ▾ > 용도 > … / 사용상태 > …` 가 가진 leaf 전부.
 * 공용 `Select` 는 단일 계층 계약이라 leaf 를 한 목록으로 펼쳐 고르고(축 이름을 라벨에 남긴다),
 * 축과 값의 쌍은 그대로 요청 입력에 실린다.
 */
export const printerBulkChanges: readonly PrinterBulkChange[] = [
  ...printerPurposes.map((value) => ({ field: 'purpose', value }) as const),
  ...printerUsages.map((value) => ({ field: 'usage', value }) as const),
];

/** select 값 ↔ cascade leaf. `field:value` 한 문자열이며 URL 로 나가지 않는다. */
export function printerBulkChangeValue(change: PrinterBulkChange): string {
  return `${change.field}:${change.value}`;
}

export function parsePrinterBulkChange(
  value: string | null,
): PrinterBulkChange | undefined {
  return printerBulkChanges.find((change) => printerBulkChangeValue(change) === value);
}

/**
 * 결과 toolbar 의 `선택 ▾ + 변경` 과 `선택복사` 두 액션의 선택 전제·확인·거절을 소유한다.
 * 원문 Case01(미선택 오류 alert)은 두 액션 모두, Case02(변경 확인 alert)는 일괄변경에만 있다.
 * 복사 완료·변경 완료 alert 는 서버 성공 뒤의 사실이라 API 연결 전에는 만들지 않는다.
 */
export function usePrinterListActions({
  selectedIds,
  onBulkChange,
  onCopy,
}: {
  readonly selectedIds: readonly string[];
  readonly onBulkChange: (request: PrinterBulkChangeRequest) => void;
  readonly onCopy: (request: PrinterCopyRequest) => void;
}) {
  const { t } = useTranslation('shared');
  const [target, setTarget] = useState<PrinterBulkChange | undefined>(undefined);
  const selectionGate = useSelectionGate(selectedIds.length);
  const bulk = useConfirmation<PrinterBulkChangeRequest>({ run: onBulkChange });

  return {
    selectionGate,
    bulk,
    target,
    setTarget,
    /** 변경할 값을 고르지 않았으면 보낼 업무가 없으므로 확인창도 열지 않는다. */
    requestBulkChange: () => {
      if (!selectionGate.requireSelection(t('bulkAction.missingSelection'))) return;
      if (target === undefined) return;
      bulk.requestConfirmation({ targetIds: [...selectedIds], change: target });
    },
    requestCopy: () => {
      if (!selectionGate.requireSelection(t('bulkAction.missingSelection'))) return;
      onCopy({ targetIds: [...selectedIds] });
    },
  };
}
