import { Button } from '@/shared/ui/primitives/Button';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { Dialog } from '@/shared/ui/primitives/Dialog';
import { Select } from '@/shared/ui/primitives/Select';
import { BulkActionDialogs, SelectionAlert } from '@/shared/ui/patterns/BulkActionDialogs';
import { FilterField } from '@/shared/ui/patterns/FilterField';
import { useTranslation } from 'react-i18next';
import type { MemberListActionIntent } from './member-row';
import { memberRestrictions } from './search-schema';
import { useMemberListActions } from './useMemberListActions';

export function MemberListActions({ searched, selectedIds, onActionIntent, onRegister }: {
  readonly searched: boolean;
  readonly selectedIds: readonly string[];
  readonly onActionIntent: (intent: MemberListActionIntent) => void;
  readonly onRegister: () => void;
}) {
  const { t } = useTranslation('members');
  const { t: sharedT } = useTranslation('shared');
  const actions = useMemberListActions({ selectedIds, onActionIntent });
  // TRANSPLANT_PENDING_MEMBER_PERMISSION: replace the visible-action baseline when the
  // product permission identifiers are contracted.
  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        {searched ? (
          <>
            <div>
              <Select
                aria-label={t('bulk.field')}
                value={actions.target}
                placeholder={t('bulk.select')}
                options={[
                  { value: 'general', label: t('accountStatus.general') },
                  { value: 'flagged', label: t('accountStatus.flagged') },
                ]}
                onValueChange={(value) => {
                  if (value === null || value === 'general' || value === 'flagged') actions.setTarget(value);
                }}
              />
              {actions.target === 'flagged' ? (
                <FilterField label={t('filters.restrictions')}>
                  {({ labelId }) => (
                    <CheckboxTree
                      ariaLabelledby={labelId}
                      selectAllLabel={t('filters.all')}
                      nodes={memberRestrictions.map((value) => ({ value, label: t(`restriction.${value}`) }))}
                      values={actions.restrictions}
                      onValueChange={actions.setRestrictions}
                    />
                  )}
                </FilterField>
              ) : null}
              {actions.incompleteError ? <p role="alert">{actions.incompleteError}</p> : null}
            </div>
            <Button onClick={actions.requestBulkChange}>{t('bulk.change')}</Button>
            <Button onClick={() => actions.requestMessage('sms')}>{t('actions.sms')}</Button>
            <Button onClick={() => actions.requestMessage('email')}>{t('actions.email')}</Button>
          </>
        ) : null}
        <Button onClick={onRegister}>{t('actions.register')}</Button>
      </div>
      <BulkActionDialogs controller={actions.bulk} confirmDescription={sharedT('bulkAction.confirm')} />
      <SelectionAlert controller={actions.selectionGate} />
      <Dialog
        open={actions.openPopup !== undefined}
        onOpenChange={(open) => { if (!open) actions.closePopup(); }}
        title={actions.openPopup ? t(`actions.${actions.openPopup}Title`) : t('dialog.title')}
      />
    </>
  );
}
