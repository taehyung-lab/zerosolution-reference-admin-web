import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { PrinterRow } from '@/features/ticketing/model/printer';
import { DataTable } from '@/shared/ui/list/DataTable';
import { ListResult } from '@/shared/ui/list/ListResult';
import type { ListResultData } from '@/shared/ui/list/ListResult';
import { Pagination } from '@/shared/ui/list/Pagination';
import { PageSizeControl } from '@/shared/ui/list/PageSizeControl';
import { ResultToolbar } from '@/shared/ui/list/ResultToolbar';
import { ResultTotal } from '@/shared/ui/list/ResultTotal';
import { SortControl } from '@/shared/ui/list/SortControl';
import type { usePrinterListResult } from './usePrinterListResult';

/**
 * 결과 영역: 건수 · 보기/정렬 · toolbar 우측 액션 · 표 · 페이지.
 * 액션 노드는 밖에서 받아 확인창 소유자의 수명을 조회 상태와 분리한다.
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

  return (
    <>
      <ResultTotal searched={data.searched} total={total} />
      <ResultToolbar
        left={
          <>
            <PageSizeControl label={t('printer.result.pageSize')} {...result.pageSize} />
            <SortControl label={t('printer.result.sort')} {...result.sort} />
          </>
        }
        right={actions}
      />
      <ListResult
        data={data}
        copy={{
          notSearched: t('printer.result.empty'),
          empty: t('printer.result.empty'),
        }}
        footer={
          <Pagination
            {...result.pagination}
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
