import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { managerSortKeys, type ManagerRow, type ManagerSortKey } from '@/features/managers/model/manager';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { DataTable } from '@/shared/ui/list/DataTable';
import { ListResult, type ListResultData } from '@/shared/ui/list/ListResult';
import { Pagination } from '@/shared/ui/list/Pagination';
import { PageSizeControl } from '@/shared/ui/list/PageSizeControl';
import { ResultToolbar } from '@/shared/ui/list/ResultToolbar';
import { ResultTotal } from '@/shared/ui/list/ResultTotal';
import { SortControl } from '@/shared/ui/list/SortControl';
import type { useManagerListResult } from './useManagerListResult';

/**
 * 결과 영역: 건수 · 보기/정렬(검색 뒤에만) · toolbar 우측 액션 · 표 · 페이지.
 * 검색 전에는 안내 문구만 있고 보기 컨트롤은 없다. 행 클릭의 목적지는 caller 가 준다.
 */
export function ManagerListResult({
  data,
  total,
  result,
  actions,
  onActivate,
}: {
  readonly data: ListResultData<ManagerRow>;
  readonly total: number;
  readonly result: ReturnType<typeof useManagerListResult>;
  readonly actions: ReactNode;
  readonly onActivate: (managerId: string) => void;
}) {
  const { t } = useTranslation('managers');
  const { view } = result;

  return (
    <>
      <ResultTotal searched={data.searched} total={total} />
      <ResultToolbar
        left={
          data.searched ? (
            <>
              <PageSizeControl
                label={t('result.pageSize')}
                options={standardPageSizeOptions}
                {...view.pageSize}
              />
              <SortControl<ManagerSortKey>
                label={t('result.sort')}
                value={view.sort.value}
                options={managerSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
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
        <DataTable
          rows={data.rows}
          columns={result.columns}
          getRowId={(row) => row.id}
          onRowActivate={(row) => onActivate(row.id)}
        />
      </ListResult>
    </>
  );
}
