import { DataTable } from '@/shared/ui/patterns/DataTable';
import { BulkActionDialogs, SelectionAlert } from '@/shared/ui/patterns/BulkActionDialogs';
import { Button } from '@/shared/ui/primitives/Button';
import { ListResult } from '@/shared/ui/patterns/ListResult';
import { PageSizeControl } from '@/shared/ui/patterns/PageSizeControl';
import { Pagination } from '@/shared/ui/patterns/Pagination';
import { ResultSummary } from '@/shared/ui/patterns/ResultSummary';
import { ResultToolbar } from '@/shared/ui/patterns/ResultToolbar';
import { SortControl } from '@/shared/ui/patterns/SortControl';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { ManagerListData } from './useManagerListData';
import type { useManagerListResult } from './useManagerListResult';
import { useManagerListActions, type ManagerListActionIntent } from './useManagerListActions';

export function ManagerListResult({
  result,
  data,
  onActionIntent,
}: {
  readonly result: ReturnType<typeof useManagerListResult>;
  readonly data: ManagerListData;
  readonly onActionIntent: (intent: ManagerListActionIntent) => void;
}) {
  const { t } = useTranslation('managers');
  const actions = useManagerListActions({
    selectedIds: result.selectedIds,
    rows: data.rows,
    onActionIntent,
  });
  const pagination = (
    <Pagination
      page={result.pagination.page}
      totalPages={result.pagination.totalPages}
      onPageChange={result.pagination.onPageChange}
      ariaLabel={t('result.paginationLabel')}
      previousLabel={t('result.previous')}
      nextLabel={t('result.next')}
    />
  );
  const registerAction = (
    <Link
      className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white"
      to="/managers/new"
    >
      {t('form.createAction')}
    </Link>
  );
  // Before the first search the design shows only the register action; summary and view
  // controls describe a result that does not exist yet (Figma 11.1 검색전).
  return (
    <section>
      {data.searched && !data.isPending ? <ResultSummary groups={result.summaryGroups} /> : null}
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
        right={
          <div className="flex flex-wrap items-start gap-2">
            {data.searched ? (
              <>
                <select
                  aria-label={t('bulk.field')}
                  className="min-h-10 rounded-md border border-neutral-300 px-3"
                  value={actions.target}
                  onChange={(event) => actions.setTarget(event.target.value as typeof actions.target)}
                >
                  <option value="">{t('bulk.select')}</option>
                  <optgroup label={t('bulk.accountStatus')}>
                    <option value="active">{t('bulk.active')}</option>
                    <option value="inactive">{t('bulk.inactive')}</option>
                  </optgroup>
                </select>
                <Button onClick={actions.requestBulkChange}>{t('bulk.change')}</Button>
              </>
            ) : null}
            {registerAction}
          </div>
        }
      />
      <ListResult
        data={data}
        copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
        footer={pagination}
      >
        <DataTable
          rows={data.rows}
          columns={result.columns}
          getRowId={(row) => row.id}
        />
      </ListResult>
      <SelectionAlert controller={actions.selectionGate} />
      <BulkActionDialogs controller={actions.bulk} confirmDescription={t('bulk.confirm')} />
    </section>
  );
}
