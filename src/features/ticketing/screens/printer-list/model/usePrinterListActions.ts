import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  bulkChangePrintersMutation,
  copyPrintersMutation,
  type PrinterBulkChangeRequest,
} from '@/features/ticketing/api/mutations';
import {
  printerPurposes,
  printerUsages,
  type PrinterBulkChange,
} from '@/features/ticketing/model/printer';
import { useLocale } from '@/shared/i18n/locale-context';
import { errorMessageKey, errorTraceOf } from '@/shared/lib/error-copy';
import { useSelectionGate } from '@/shared/model/use-selection-gate';


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

export function parsePrinterBulkChange(value: string | null): PrinterBulkChange | undefined {
  return printerBulkChanges.find((change) => printerBulkChangeValue(change) === value);
}

/**
 * 결과 toolbar 의 `선택 ▾ + 변경` 과 `선택복사` 두 액션의 **선택 전제와 실행**을 소유한다. 확인창의 상태와
 * 렌더는 늘 mount 되는 Actions 컴포넌트가 갖는다 — 이 훅은 JSX 를 모른다.
 * 원문 Case01(미선택 오류 alert)은 두 액션 모두, Case02(변경 확인 alert)는 일괄변경에만 있다. 선택복사는
 * 확인 없이 바로 실행하므로 그 lifecycle 에 억지로 합치지 않고 여기서 끝낸다.
 */
export function usePrinterListActions(selectedIds: readonly string[]) {
  const { t } = useTranslation('shared');
  const { locale } = useLocale();
  const [target, setTarget] = useState<PrinterBulkChange | undefined>(undefined);
  const gate = useSelectionGate(selectedIds.length);
  const bulkChange = useMutation(bulkChangePrintersMutation(locale));
  const copy = useMutation(copyPrintersMutation(locale));

  return {
    gate,
    target,
    setTarget,
    /** 변경할 값을 고르지 않았으면 보낼 업무가 없으므로 요청도 만들지 않는다. */
    prepareBulkChange: (): PrinterBulkChangeRequest | undefined => {
      if (!gate.requireSelection(t('bulkAction.missingSelection'))) return undefined;
      if (target === undefined) return undefined;
      return { targetIds: [...selectedIds], change: target };
    },
    runBulkChange: (request: PrinterBulkChangeRequest) => bulkChange.mutateAsync(request),
    requestCopy: () => {
      if (!gate.requireSelection(t('bulkAction.missingSelection'))) return;
      copy.mutate(
        { targetIds: [...selectedIds] },
        { onError: (error) => gate.reject(t(errorMessageKey(errorTraceOf(error).kind))) },
      );
    },
  };
}
