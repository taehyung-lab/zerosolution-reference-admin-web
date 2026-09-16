import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { accessSortKeys, type AccessSortKey, type MemberAccessRow } from '@/features/members/model/member-records';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { DataTable } from '@/shared/ui/list/DataTable';
import { ListResult, type ListResultData } from '@/shared/ui/list/ListResult';
import { PageSizeControl } from '@/shared/ui/list/PageSizeControl';
import { Pagination } from '@/shared/ui/list/Pagination';
import { ResultToolbar } from '@/shared/ui/list/ResultToolbar';
import { ResultTotal } from '@/shared/ui/list/ResultTotal';
import { SortControl } from '@/shared/ui/list/SortControl';
import type { useAccessListResult } from './useAccessListResult';

/** 결과 영역: 건수 · 보기/정렬(검색 뒤에만) · toolbar 우측 액션 · 표 · 페이지. 접속 행은 열리는 상세가 없다. */
export function AccessListResult({
  data,
  total,
  result,
  actions,
}: {
  readonly data: ListResultData<MemberAccessRow>;
  readonly total: number;
  readonly result: ReturnType<typeof useAccessListResult>;
  readonly actions: ReactNode;
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
              <SortControl<AccessSortKey>
                label={t('result.sort')}
                value={view.sort.value}
                options={accessSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
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
        <DataTable rows={data.rows} columns={result.columns} getRowId={(row) => row.id} />
      </ListResult>
    </>
  );
}
