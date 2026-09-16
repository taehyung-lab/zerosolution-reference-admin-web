import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  printerSortKeys,
  type PrinterRow,
  type PrinterSortKey,
} from '@/features/ticketing/model/printer';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { DataTable } from '@/shared/ui/list/DataTable';
import { ListResult, type ListResultData } from '@/shared/ui/list/ListResult';
import { Pagination } from '@/shared/ui/list/Pagination';
import { PageSizeControl } from '@/shared/ui/list/PageSizeControl';
import { ResultToolbar } from '@/shared/ui/list/ResultToolbar';
import { ResultTotal } from '@/shared/ui/list/ResultTotal';
import { SortControl } from '@/shared/ui/list/SortControl';
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
  readonly data: ListResultData<PrinterRow>;
  readonly total: number;
  readonly result: ReturnType<typeof usePrinterListResult>;
  readonly actions: ReactNode;
  readonly onActivate: (printerId: string) => void;
}) {
  const { t } = useTranslation('ticketing');
  const { view } = result;

  return (
    <>
      <ResultTotal searched={data.searched} total={total} />
      <ResultToolbar
        left={
          <>
            <PageSizeControl
              label={t('printer.result.pageSize')}
              options={standardPageSizeOptions}
              {...view.pageSize}
            />
            <SortControl<PrinterSortKey>
              label={t('printer.result.sort')}
              value={view.sort.value}
              options={printerSortKeys.map((value) => ({ value, label: t(`printer.sort.${value}`) }))}
              onValueChange={view.sort.onValueChange}
            />
          </>
        }
        right={actions}
      />
      <ListResult
        data={data}
        copy={{ notSearched: t('printer.result.empty'), empty: t('printer.result.empty') }}
        footer={
          <Pagination
            {...view.pagination}
            ariaLabel={t('printer.result.pagination.label')}
            previousLabel={t('printer.result.pagination.previous')}
            nextLabel={t('printer.result.pagination.next')}
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
