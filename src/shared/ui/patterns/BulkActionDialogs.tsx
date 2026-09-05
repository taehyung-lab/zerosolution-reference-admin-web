import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertDialog } from './AlertDialog';
import { ConfirmDialog } from './ConfirmDialog';

type BulkDialogState<TValues> =
  | { readonly kind: 'closed' }
  | { readonly kind: 'confirm'; readonly values: TValues };

export function useSelectionGate(selectedCount: number) {
  const [message, setMessage] = useState<string>();

  return {
    message,
    requireSelection: (missingSelectionMessage: string) => {
      if (selectedCount > 0) return true;
      setMessage(missingSelectionMessage);
      return false;
    },
    /**
     * Every precheck an action button runs fails the same way, so a caller's other rules
     * (an unfinished cascade value, for example) reject into this alert instead of growing
     * their own inline error state. Returns `false` so a check reads as one `return`.
     */
    reject: (message: string) => {
      setMessage(message);
      return false;
    },
    close: () => setMessage(undefined),
  };
}

export function SelectionAlert({
  controller,
}: {
  readonly controller: ReturnType<typeof useSelectionGate>;
}) {
  const { t } = useTranslation('shared');
  return (
    <AlertDialog
      open={controller.message !== undefined}
      onOpenChange={(open) => {
        if (!open) controller.close();
      }}
      title={t('alert.title')}
      description={controller.message}
      acknowledgeLabel={t('bulkAction.acknowledge')}
    />
  );
}

export function useBulkActionDialogs<TValues>({
  run,
}: {
  readonly run: (values: TValues) => void;
}) {
  const [state, setState] = useState<BulkDialogState<TValues>>({ kind: 'closed' });

  return {
    state,
    requestConfirmation: (values: TValues) => setState({ kind: 'confirm', values }),
    close: () => setState({ kind: 'closed' }),
    confirm: () => {
      if (state.kind !== 'confirm') return;
      run(state.values);
      setState({ kind: 'closed' });
    },
  };
}

export function BulkActionDialogs<TValues>({
  controller,
  confirmDescription,
}: {
  readonly controller: ReturnType<typeof useBulkActionDialogs<TValues>>;
  readonly confirmDescription: string;
}) {
  const { t } = useTranslation('shared');
  return (
    <ConfirmDialog
      open={controller.state.kind === 'confirm'}
      onOpenChange={(open) => {
        if (!open) controller.close();
      }}
      title={t('alert.title')}
      description={confirmDescription}
      confirmLabel={t('bulkAction.acknowledge')}
      cancelLabel={t('bulkAction.cancel')}
      onConfirm={controller.confirm}
    />
  );
}
