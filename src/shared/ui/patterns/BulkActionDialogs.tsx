import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertDialog } from './AlertDialog';
import { ConfirmDialog } from './ConfirmDialog';

type BulkDialogState<TValues> =
  | { readonly kind: 'closed' }
  | { readonly kind: 'missingSelection' }
  | { readonly kind: 'confirm'; readonly values: TValues };

export function useBulkActionDialogs<TValues>({
  selectedCount,
  run,
}: {
  readonly selectedCount: number;
  readonly run: (values: TValues) => void;
}) {
  const [state, setState] = useState<BulkDialogState<TValues>>({ kind: 'closed' });

  return {
    state,
    requireSelection: () => {
      if (selectedCount > 0) return true;
      setState({ kind: 'missingSelection' });
      return false;
    },
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
}: {
  readonly controller: ReturnType<typeof useBulkActionDialogs<TValues>>;
}) {
  const { t } = useTranslation('shared');
  return (
    <>
      <AlertDialog
        open={controller.state.kind === 'missingSelection'}
        onOpenChange={(open) => {
          if (!open) controller.close();
        }}
        title={t('alert.title')}
        description={t('bulkAction.missingSelection')}
        acknowledgeLabel={t('bulkAction.acknowledge')}
      />
      <ConfirmDialog
        open={controller.state.kind === 'confirm'}
        onOpenChange={(open) => {
          if (!open) controller.close();
        }}
        title={t('alert.title')}
        description={t('bulkAction.confirm')}
        confirmLabel={t('bulkAction.acknowledge')}
        cancelLabel={t('bulkAction.cancel')}
        onConfirm={controller.confirm}
      />
    </>
  );
}
