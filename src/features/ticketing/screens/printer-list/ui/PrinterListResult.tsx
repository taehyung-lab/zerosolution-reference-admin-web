import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  printerSortKeys,
  type PrinterRow,
} from '@/features/ticketing/model/printer';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import type { ListResultData } from '@/shared/ui/list/ListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import type { usePrinterListResult } from './usePrinterListResult';

/**
 * 결과 영역: 건수 · 보기/정렬 · toolbar 우측 액션 · 표 · 페이지.
 * 행 클릭은 원문 `특정 행 클릭시, 콘텐츠 조회 화면으로 이동` 이며 목적지는 caller 가 준다.
 */
export function PrinterListResult({
  data,
  total,
  result,
  actions,
  onActivate,
}: {
  readonly data: ListResultData<PrinterRow, true>;
  readonly total: number;
  readonly result: ReturnType<typeof usePrinterListResult>;
  readonly actions: ReactNode;
  readonly onActivate: (printerId: string) => void;
}) {
  const { t } = useTranslation('ticketing');

  return (
    <PagedListResult
      data={data}
      total={total}
      view={result.view}
      columns={result.columns}
      getRowId={(row) => row.id}
      onRowActivate={(row) => onActivate(row.id)}
      actions={actions}
      copy={{ empty: t('printer.result.empty') }}
      pageSizeOptions={standardPageSizeOptions}
      sortOptions={printerSortKeys.map((value) => ({ value, label: t(`printer.sort.${value}`) }))}
    />
  );
}
