import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { bulkChangeManagersMutation } from '@/features/managers/api/mutations';
import type { ManagerBulkChangeRequest, ManagerRow } from '@/features/managers/model/manager';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSelectionGate } from '@/shared/model/use-selection-gate';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';

/**
 * 결과 toolbar 의 `변경 항목 ▾ + 변경` 일괄변경의 선택 전제·확인·실행을 소유한다.
 * 원문은 대기·거절·잠금 행을 변경 대상에서 제외한다(선택에서 제외하지 않는다): 섞여 있으면 제외 안내가 담긴
 * 확인창을 지나 대상만 보내고, 전부 제외 대상이면 alert 만 연다.
 */
export function useManagerListActions(selectedIds: readonly string[], rows: readonly ManagerRow[]) {
  const { t } = useTranslation('shared');
  const { t: managers } = useTranslation('managers');
  const { locale } = useLocale();
  const [target, setTarget] = useState<ManagerBulkChangeRequest['accountStatus'] | undefined>();
  const gate = useSelectionGate(selectedIds.length);
  const bulkChange = useMutation(bulkChangeManagersMutation(locale));
  const eligibleIds = new Set(
    rows
      .filter((row) => row.accountStatus === 'active' || row.accountStatus === 'inactive')
      .map((row) => row.id),
  );
  const confirmation = useConfirmation<ManagerBulkChangeRequest>({
    run: (request) => bulkChange.mutateAsync(request),
    description: managers('bulk.confirm'),
  });

  return {
    gate,
    target,
    setTarget,
    dialog: confirmation.dialog,
    requestBulkChange: () => {
      if (!gate.requireSelection(t('bulkAction.missingSelection'))) return;
      const targetIds = selectedIds.filter((id) => eligibleIds.has(id));
      if (targetIds.length === 0) return gate.reject(managers('bulk.unavailable'));
      if (target === undefined) return;
      confirmation.request({ targetIds, accountStatus: target });
    },
  };
}
