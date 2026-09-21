import { useTranslation } from 'react-i18next';
import type { useSelectionGate } from '@/shared/hooks/use-selection-gate';
import { AlertDialog } from './AlertDialog';

/** The one rejection alert of every selection-gated action. The gate owns the message; this renders it. */
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
