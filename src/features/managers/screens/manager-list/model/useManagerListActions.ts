import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { bulkChangeManagersMutation } from '@/features/managers/api/mutations';
import type { ManagerBulkChangeRequest, ManagerRow } from '@/features/managers/model/manager';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSelectionGate } from '@/shared/hooks/use-selection-gate';

/**
 * 결과 toolbar 의 `변경 항목 ▾ + 변경` 일괄변경의 **선택 전제와 실행**을 소유한다. 확인창의 상태와 렌더는
 * 늘 mount 되는 Actions 컴포넌트가 갖는다 — 이 훅은 JSX 를 모른다.
 * 원문은 대기·거절·잠금 행을 변경 대상에서 제외한다(선택에서 제외하지 않는다): 섞여 있으면 대상만 추려
 * 요청을 만들고, 전부 제외 대상이면 요청 없이 alert 만 연다.
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

  return {
    gate,
    target,
    setTarget,
    /** 보낼 업무가 성립하면 요청을, 아니면 `undefined` 를 준다. 거절은 여기서 한 alert 로 끝난다. */
    prepareBulkChange: (): ManagerBulkChangeRequest | undefined => {
      if (!gate.requireSelection(t('bulkAction.missingSelection'))) return undefined;
      const targetIds = selectedIds.filter((id) => eligibleIds.has(id));
      if (targetIds.length === 0) {
        gate.reject(managers('bulk.unavailable'));
        return undefined;
      }
      if (target === undefined) return undefined;
      return { targetIds, accountStatus: target };
    },
    runBulkChange: (request: ManagerBulkChangeRequest) => bulkChange.mutateAsync(request),
  };
}
