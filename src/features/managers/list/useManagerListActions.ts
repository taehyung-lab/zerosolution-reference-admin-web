import {
  useBulkActionDialogs,
  useSelectionGate,
} from '@/shared/ui/patterns/BulkActionDialogs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ManagerListItem } from '../model/manager';

export interface ManagerListActionRequest {
  readonly type: 'bulkChange';
  readonly targetIds: readonly string[];
  readonly values: { readonly accountStatus: 'active' | 'inactive' };
}

/**
 * Owns the manager toolbar workflow. Unlike members this has no cascade and no unfinished
 * value; it has a row rule instead — Notion excludes 대기·거절·잠금 rows and names them in the
 * confirmation. That rule is applied where the request is built, not when rows are selected,
 * because the confirmation states the exclusion rather than blocking the selection.
 */
export function useManagerListActions({
  selectedIds,
  rows,
  onActionRequest,
}: {
  readonly selectedIds: readonly string[];
  readonly rows: readonly ManagerListItem[];
  readonly onActionRequest: (intent: ManagerListActionRequest) => void;
}) {
  const { t } = useTranslation('shared');
  const [target, setTarget] = useState<
    null | ManagerListActionRequest['values']['accountStatus']
  >(null);
  const selectionGate = useSelectionGate(selectedIds.length);
  const bulk = useBulkActionDialogs({
    run: (intent: ManagerListActionRequest) => {
      // TRANSPLANT_PENDING_MANAGER_BULK_REJECTED_STATUS: the confirmation names waiting,
      // rejected and locked, but only AWAITING/LOCKED are mapped. Add the rejected code
      // when contracted; rehearsal INACTIVE must not be assumed to mean rejected.
      const eligibleIds = new Set(
        rows
          .filter((row) => row.status !== 'AWAITING' && row.status !== 'LOCKED')
          .map((row) => row.id),
      );
      const targetIds = intent.targetIds.filter((id) => eligibleIds.has(id));
      if (targetIds.length > 0) onActionRequest({ ...intent, targetIds });
    },
  });

  return {
    selectionGate,
    bulk,
    target,
    setTarget,
    requestBulkChange: () => {
      if (!selectionGate.requireSelection(t('bulkAction.missingSelection'))) return;
      if (target === null) return;
      bulk.requestConfirmation({
        type: 'bulkChange',
        targetIds: [...selectedIds],
        values: { accountStatus: target },
      });
    },
  };
}
