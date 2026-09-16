import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import {
  printerListSearch,
  type PrinterListSearch,
  type PrinterListView,
} from '../model/printer-list-search';
import { usePrinterListData } from '../model/usePrinterListData';
import { usePrinterListFilter } from '../model/usePrinterListFilter';
import { PrinterListActions } from './PrinterListActions';
import { PrinterListFilters } from './PrinterListFilters';
import { PrinterListResult } from './PrinterListResult';
import { usePrinterListResult } from './usePrinterListResult';

/**
 * 6.7.1 스마트프린터 목록(발권 > 부가기능). 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 를 넘기고 화면이 한 번 해소한다. 모든 URL 전이는 `commit` 한 곳으로
 * 나가며 canonical 로 줄여 `onSearchChange` 에 넘긴다.
 */
export function PrinterListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
  onCreate,
}: {
  readonly search: PrinterListSearch;
  readonly onSearchChange: (next: PrinterListSearch) => void;
  readonly onActivate: (printerId: string) => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('ticketing');
  const search = printerListSearch.resolve(sparse);
  const commit = (next: PrinterListView) => onSearchChange(printerListSearch.canonical.parse(next));
  const filter = usePrinterListFilter(search, commit);
  const { rows, total, totalPages, ...data } = usePrinterListData(search);
  const result = usePrinterListResult({ search, rows, totalPages, commit });

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
        data={{ rows, ...data }}
        total={total}
        result={result}
        actions={
          <PrinterListActions selectedIds={result.selection.selectedIds} onCreate={onCreate} />
        }
        onActivate={onActivate}
      />
    </section>
  );
}
