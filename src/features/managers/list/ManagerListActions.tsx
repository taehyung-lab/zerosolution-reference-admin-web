import { BulkActionDialogs, SelectionAlert } from '@/shared/ui/patterns/BulkActionDialogs';
import { Button } from '@/shared/ui/primitives/Button';
import { Select } from '@/shared/ui/primitives/Select';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { ManagerListItem } from '../model/manager';
import { useManagerListActions, type ManagerListActionIntent } from './useManagerListActions';

export function ManagerListActions({ searched, selectedIds, rows, onActionIntent }: {
  readonly searched: boolean;
  readonly selectedIds: readonly string[];
  readonly rows: readonly ManagerListItem[];
  readonly onActionIntent: (intent: ManagerListActionIntent) => void;
}) {
  const { t } = useTranslation('managers');
  const actions = useManagerListActions({ selectedIds, rows, onActionIntent });
  const registerAction = (
    <Link
      className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white"
      to="/managers/new"
    >
      {t('form.createAction')}
    </Link>
  );
  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        {searched ? (
          <>
            <Select
              aria-label={t('bulk.field')}
              className="w-auto"
              value={actions.target}
              placeholder={t('bulk.select')}
              options={[
                { value: 'active', label: t('bulk.active') },
                { value: 'inactive', label: t('bulk.inactive') },
              ]}
              onValueChange={(value) => {
                if (value === null || value === 'active' || value === 'inactive') actions.setTarget(value);
              }}
            />
            <Button onClick={actions.requestBulkChange}>{t('bulk.change')}</Button>
          </>
        ) : null}
        {registerAction}
      </div>
      <SelectionAlert controller={actions.selectionGate} />
      <BulkActionDialogs controller={actions.bulk} confirmDescription={t('bulk.confirm')} />
    </>
  );
}
