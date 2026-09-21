import { useTranslation } from 'react-i18next';
import {
  performanceSortKeys,
  type PerformanceRow,
} from '@/features/performances/model/performance';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import type { ListResultData } from '@/shared/ui/list/ListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import type { usePerformanceListResult } from './usePerformanceListResult';

/** 결과 영역: 보기/정렬 · 건수 · 표 · 페이지. toolbar 우측 액션은 원장에 없다. 행 클릭의 목적지는 caller 가 준다. */
export function PerformanceListResult({
  data,
  total,
  result,
  onActivate,
}: {
  readonly data: ListResultData<PerformanceRow, true>;
  readonly total: number;
  readonly result: ReturnType<typeof usePerformanceListResult>;
  readonly onActivate: (performanceId: string) => void;
}) {
  const { t } = useTranslation('performances');

  return (
    <PagedListResult
      data={data}
      total={total}
      view={result.view}
      columns={result.columns}
      getRowId={(row) => row.id}
      onRowActivate={(row) => onActivate(row.id)}
      copy={{ empty: t('result.empty') }}
      pageSizeOptions={standardPageSizeOptions}
      sortOptions={performanceSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
    />
  );
}
