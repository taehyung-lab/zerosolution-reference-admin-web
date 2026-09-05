import type { ReactNode } from 'react';
import { DataTable } from '@/shared/ui/patterns/DataTable';
import { ListResult } from '@/shared/ui/patterns/ListResult';
import { PageSizeControl } from '@/shared/ui/patterns/PageSizeControl';
import { Pagination } from '@/shared/ui/patterns/Pagination';
import { ResultSummary } from '@/shared/ui/patterns/ResultSummary';
import { ResultToolbar } from '@/shared/ui/patterns/ResultToolbar';
import { SortControl } from '@/shared/ui/patterns/SortControl';
import { useTranslation } from 'react-i18next';
import type { MemberListData } from './useMemberListData';
import type { useMemberListResult } from './useMemberListResult';

export function MemberListResult({
  data,
  result,
  toolbarRight,
  onMemberActivate,
}: {
  readonly data: MemberListData;
  readonly result: ReturnType<typeof useMemberListResult>;
  readonly toolbarRight: ReactNode;
  readonly onMemberActivate: (memberId: string) => void;
}) {
  const { t } = useTranslation('members');

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
    </section>
  );
}
