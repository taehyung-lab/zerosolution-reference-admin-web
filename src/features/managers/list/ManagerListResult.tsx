import { DataTable } from '@/shared/ui/patterns/DataTable';
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

export function ManagerListResult({
  result,
  data,
}: {
  readonly result: ReturnType<typeof useManagerListResult>;
  readonly data: ManagerListData;
}) {
  const { t } = useTranslation('managers');
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
        right={registerAction}
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
    </section>
  );
}
