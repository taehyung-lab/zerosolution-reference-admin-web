import { useBulkActionDialogs, useSelectionGate } from '@/shared/ui/patterns/BulkActionDialogs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MemberListActionIntent } from './member-row';

type BulkTarget = null | 'general' | 'flagged';

/**
 * Owns the toolbar workflow up to the request boundary: cascade assembly, the incomplete-value
 * rejection, and which dialog is open. The screen keeps payload shape and popup copy.
 */
export function useMemberListActions({
  selectedIds,
  onActionIntent,
}: {
  readonly selectedIds: readonly string[];
  readonly onActionIntent: (intent: MemberListActionIntent) => void;
}) {
  const { t } = useTranslation('members');
  const { t: sharedT } = useTranslation('shared');
  const [target, setTarget] = useState<BulkTarget>(null);
  const [restrictions, setRestrictions] = useState<readonly string[]>([]);
  const [incompleteError, setIncompleteError] = useState<string>();
  const [openPopup, setOpenPopup] = useState<'sms' | 'email'>();

  const selectionGate = useSelectionGate(selectedIds.length);
  const bulk = useBulkActionDialogs({
    run: (intent: MemberListActionIntent) => onActionIntent(intent),
  });

  const requestBulkChange = () => {
    if (!selectionGate.requireSelection(sharedT('bulkAction.missingSelection'))) return;
    if (target === null || (target === 'flagged' && restrictions.length === 0)) {
      setIncompleteError(t('bulk.incomplete'));
      return;
    }
    setIncompleteError(undefined);
    bulk.requestConfirmation({
      type: 'bulkChange',
      targetIds: [...selectedIds],
      values: {
        accountStatus: target,
        restrictions: target === 'flagged' ? [...restrictions] : [],
      },
    });
  };

  const requestMessage = (type: 'sms' | 'email') => {
    if (!selectionGate.requireSelection(t(`actions.${type}Missing`))) return;
    onActionIntent({ type, targetIds: [...selectedIds] });
    setOpenPopup(type);
  };

  return {
    bulk,
    selectionGate,
    target,
    setTarget,
    restrictions,
    setRestrictions,
    incompleteError,
    requestBulkChange,
    requestMessage,
    openPopup,
    closePopup: () => setOpenPopup(undefined),
  };
}
