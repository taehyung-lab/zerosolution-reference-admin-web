import { Button } from '@/shared/ui/primitives/Button';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { Dialog } from '@/shared/ui/primitives/Dialog';
import { BulkActionDialogs, SelectionAlert } from '@/shared/ui/patterns/BulkActionDialogs';
import { DataTable } from '@/shared/ui/patterns/DataTable';
import { FilterField } from '@/shared/ui/patterns/FilterField';
import { ListResult } from '@/shared/ui/patterns/ListResult';
import { PageSizeControl } from '@/shared/ui/patterns/PageSizeControl';
import { Pagination } from '@/shared/ui/patterns/Pagination';
import { ResultSummary } from '@/shared/ui/patterns/ResultSummary';
import { ResultToolbar } from '@/shared/ui/patterns/ResultToolbar';
import { SortControl } from '@/shared/ui/patterns/SortControl';
import { useTranslation } from 'react-i18next';
import type { MemberListActionIntent } from './member-row';
import { useMemberListActions } from './useMemberListActions';
import type { MemberListData } from './useMemberListData';
import type { useMemberListResult } from './useMemberListResult';

export function MemberListResult({
  data,
  result,
  onActionIntent,
  onMemberActivate,
  onRegister,
}: {
  readonly data: MemberListData;
  readonly result: ReturnType<typeof useMemberListResult>;
  readonly onActionIntent: (intent: MemberListActionIntent) => void;
  readonly onMemberActivate: (memberId: string) => void;
  readonly onRegister: () => void;
}) {
  const { t } = useTranslation('members');
  const { t: sharedT } = useTranslation('shared');
  const actions = useMemberListActions({ selectedIds: result.selectedIds, onActionIntent });

  // TRANSPLANT_PENDING_MEMBER_PERMISSION: replace the visible-action baseline when the
  // product permission identifiers are contracted.
  const toolbarRight = (
    <div className="flex flex-wrap items-start gap-2">
      {data.searched ? (
        <>
          <div>
            <select
              aria-label={t('bulk.field')}
              value={actions.target}
              onChange={(event) => actions.setTarget(event.target.value as typeof actions.target)}
            >
              <option value="">{t('bulk.select')}</option>
              <option value="general">{t('accountStatus.general')}</option>
              <option value="flagged">{t('accountStatus.flagged')}</option>
            </select>
            {actions.target === 'flagged' ? (
              <FilterField label={t('filters.restrictions')}>
                {({ labelId }) => (
                  <CheckboxTree
                    ariaLabelledby={labelId}
                    selectAllLabel={t('filters.all')}
                    nodes={[
                      { value: 'specialContent', label: t('restriction.specialContent') },
                      { value: 'inquiry', label: t('restriction.inquiry') },
                      { value: 'entry', label: t('restriction.entry') },
                    ]}
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
  );

  return (
    <section>
      {data.searched ? <ResultSummary groups={result.summaryGroups} /> : null}
      <ResultToolbar
        left={
          data.searched ? (
            <>
              <PageSizeControl
                label={t('result.pageSize')}
                value={result.pageSize.value}
                options={result.pageSize.options}
                onValueChange={result.pageSize.onChange}
              />
              <SortControl
                label={t('result.sort')}
                value={result.sort.value}
                options={result.sort.options}
                onValueChange={result.sort.onValueChange}
              />
            </>
          ) : null
        }
        right={toolbarRight}
      />
      <ListResult
        data={data}
        copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
        footer={
          <Pagination
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            onPageChange={result.pagination.onPageChange}
            ariaLabel={t('result.paginationLabel')}
            previousLabel={t('result.previous')}
            nextLabel={t('result.next')}
          />
        }
      >
        <DataTable
          rows={data.rows}
          columns={result.columns}
          getRowId={(row) => row.key}
          onRowActivate={(row) => onMemberActivate(row.key)}
        />
      </ListResult>
      <BulkActionDialogs controller={actions.bulk} confirmDescription={sharedT('bulkAction.confirm')} />
      <SelectionAlert controller={actions.selectionGate} />
      <Dialog
        open={actions.openPopup !== undefined}
        onOpenChange={(open) => { if (!open) actions.closePopup(); }}
        title={actions.openPopup ? t(`actions.${actions.openPopup}Title`) : t('dialog.title')}
      />
    </section>
  );
}
