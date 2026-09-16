import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { dormantSortKeys, type DormantMemberRow, type DormantSortKey } from '@/features/members/model/member-records';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { DataTable } from '@/shared/ui/list/DataTable';
import { ListResult, type ListResultData } from '@/shared/ui/list/ListResult';
import { PageSizeControl } from '@/shared/ui/list/PageSizeControl';
import { Pagination } from '@/shared/ui/list/Pagination';
import { ResultToolbar } from '@/shared/ui/list/ResultToolbar';
import { ResultTotal } from '@/shared/ui/list/ResultTotal';
import { SortControl } from '@/shared/ui/list/SortControl';
import type { useDormantListResult } from './useDormantListResult';

/** 결과 영역: 건수 · 보기/정렬(검색 뒤에만) · toolbar 우측 액션 · 표 · 페이지. */
export function DormantListResult({
  data,
  total,
  result,
  actions,
  onActivate,
}: {
  readonly data: ListResultData<DormantMemberRow>;
  readonly total: number;
  readonly result: ReturnType<typeof useDormantListResult>;
  readonly actions: ReactNode;
  readonly onActivate: (memberId: string) => void;
}) {
  const { t } = useTranslation('members');
  const { view } = result;

  return (
    <>
      <ResultTotal searched={data.searched} total={total} />
      <ResultToolbar
        left={
          data.searched ? (
            <>
              <PageSizeControl label={t('result.pageSize')} options={standardPageSizeOptions} {...view.pageSize} />
              <SortControl<DormantSortKey>
                label={t('result.sort')}
                value={view.sort.value}
                options={dormantSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
                onValueChange={view.sort.onValueChange}
              />
            </>
          ) : null
        }
        right={actions}
      />
      <ListResult
        data={data}
        copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
        footer={
          <Pagination
            {...view.pagination}
            ariaLabel={t('result.paginationLabel')}
            previousLabel={t('result.previous')}
            nextLabel={t('result.next')}
          />
        }
      >
        <DataTable rows={data.rows} columns={result.columns} getRowId={(row) => row.id} onRowActivate={(row) => onActivate(row.id)} />
      </ListResult>
    </>
  );
}
