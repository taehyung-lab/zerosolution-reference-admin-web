import { useTranslation } from 'react-i18next';
import {
  performanceSortKeys,
  type PerformanceRow,
  type PerformanceSortKey,
} from '@/features/performances/model/performance';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { DataTable } from '@/shared/ui/list/DataTable';
import { ListResult, type ListResultData } from '@/shared/ui/list/ListResult';
import { Pagination } from '@/shared/ui/list/Pagination';
import { PageSizeControl } from '@/shared/ui/list/PageSizeControl';
import { ResultToolbar } from '@/shared/ui/list/ResultToolbar';
import { ResultTotal } from '@/shared/ui/list/ResultTotal';
import { SortControl } from '@/shared/ui/list/SortControl';
import type { usePerformanceListResult } from './usePerformanceListResult';

/** 결과 영역: 보기/정렬 · 건수 · 표 · 페이지. toolbar 우측 액션은 원장에 없다. 행 클릭의 목적지는 caller 가 준다. */
export function PerformanceListResult({
  data,
  total,
  result,
  onActivate,
}: {
  readonly data: ListResultData<PerformanceRow>;
  readonly total: number;
  readonly result: ReturnType<typeof usePerformanceListResult>;
  readonly onActivate: (performanceId: string) => void;
}) {
  const { t } = useTranslation('performances');
  const { view } = result;

  return (
    <>
      <ResultToolbar
        left={
          <>
            <PageSizeControl
              label={t('result.pageSize')}
              options={standardPageSizeOptions}
              {...view.pageSize}
            />
            <SortControl<PerformanceSortKey>
              label={t('result.sort')}
              value={view.sort.value}
              options={performanceSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
              onValueChange={view.sort.onValueChange}
            />
          </>
        }
      />
      <ResultTotal searched={data.searched} total={total} />
      <ListResult
        data={data}
        copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
        footer={
          <Pagination
            {...view.pagination}
            ariaLabel={t('result.pagination')}
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
