import {
  useBulkActionDialogs,
  useSelectionGate,
} from '@/shared/ui/patterns/BulkActionDialogs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ManagerListItem } from '../model/manager';

export interface ManagerListActionIntent {
  readonly type: 'bulkChange';
  readonly targetIds: readonly string[];
  readonly values: { readonly accountStatus: 'active' | 'inactive' };
}

export function useManagerListActions({
  selectedIds,
  rows,
  onActionIntent,
}: {
  readonly selectedIds: readonly string[];
  readonly rows: readonly ManagerListItem[];
  readonly onActionIntent: (intent: ManagerListActionIntent) => void;
}) {
  const { t } = useTranslation('shared');
  const [target, setTarget] = useState<
    '' | ManagerListActionIntent['values']['accountStatus']
  >('');
  const selectionGate = useSelectionGate(selectedIds.length);
  const bulk = useBulkActionDialogs({
    run: (intent: ManagerListActionIntent) => {
      // TRANSPLANT_PENDING_MANAGER_BULK_REJECTED_STATUS: the confirmation names waiting,
      // rejected and locked, but only AWAITING/LOCKED are mapped. Add the rejected code
      // when contracted; rehearsal INACTIVE must not be assumed to mean rejected.
      const eligibleIds = new Set(
        rows
          .filter((row) => row.status !== 'AWAITING' && row.status !== 'LOCKED')
          .map((row) => row.id),
      );
      const targetIds = intent.targetIds.filter((id) => eligibleIds.has(id));
      if (targetIds.length > 0) onActionIntent({ ...intent, targetIds });
    },
  });

  return {
    selectionGate,
    bulk,
    target,
    setTarget,
    requestBulkChange: () => {
      if (!selectionGate.requireSelection(t('bulkAction.missingSelection'))) return;
      if (target === '') return;
      bulk.requestConfirmation({
        type: 'bulkChange',
        targetIds: [...selectedIds],
        values: { accountStatus: target },
      });
    },
  };
}
