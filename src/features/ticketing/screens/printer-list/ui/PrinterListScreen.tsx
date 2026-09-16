import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { resolvePrinterListSearch } from '../model/printer-list-search';
import type { PrinterListSearch } from '../model/printer-list-search';
import { usePrinterListData } from '../model/usePrinterListData';
import { usePrinterListFilter } from '../model/usePrinterListFilter';
import type {
  PrinterBulkChangeRequest,
  PrinterCopyRequest,
} from '../model/usePrinterListActions';
import { PrinterListActions } from './PrinterListActions';
import { PrinterListFilters } from './PrinterListFilters';
import { PrinterListResult } from './PrinterListResult';
import { usePrinterListResult } from './usePrinterListResult';

/**
 * 6.7.1 스마트프린터 목록(발권 > 부가기능). 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 를 넘기고 화면 경계에서 한 번 해소한다.
 * 모든 URL 전이는 `onSearchChange` 한 곳으로 나간다.
 */
export function PrinterListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
  onCreate,
  onBulkChange,
  onCopy,
}: {
  readonly search: PrinterListSearch;
  readonly onSearchChange: (next: PrinterListSearch) => void;
  readonly onActivate: (printerId: string) => void;
  readonly onCreate: () => void;
  readonly onBulkChange: (request: PrinterBulkChangeRequest) => void;
  readonly onCopy: (request: PrinterCopyRequest) => void;
}) {
  const { t } = useTranslation('ticketing');
  const search = resolvePrinterListSearch(sparse);
  const filter = usePrinterListFilter(search, onSearchChange);
  const { rows, total, totalPages, searched, isPending, isFetching, isError, trace, retry } =
    usePrinterListData(search);
  const result = usePrinterListResult({ search, rows, totalPages, onSearchChange });

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('printer.breadcrumb.ticketing'),
          t('printer.breadcrumb.extras'),
          t('printer.breadcrumb.printers'),
        ]}
        title={t('printer.title')}
      />
      <PrinterListFilters filter={filter} />
      <PrinterListResult
        data={{ rows, searched, isPending, isFetching, isError, trace, retry }}
        total={total}
        result={result}
        actions={
          <PrinterListActions
            selectedIds={result.selection.selectedIds}
            onBulkChange={onBulkChange}
            onCopy={onCopy}
            onCreate={onCreate}
          />
        }
        onActivate={onActivate}
      />
    </section>
  );
}
