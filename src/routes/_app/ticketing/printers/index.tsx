import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import {
  printerListCanonicalSchema,
  printerListSearchContract,
} from '@/features/ticketing/screens/printer-list/model/printer-list-search';
import {
  requestPrinterBulkChange,
  requestPrinterCopy,
} from '@/features/ticketing/screens/printer-list/model/printer-list-requests';
import { PrinterListScreen } from '@/features/ticketing/screens/printer-list/ui/PrinterListScreen';

/**
 * 이 화면에는 선택지 query 가 없으므로 loader 도 없다(선택지가 전부 도메인 상수다).
 * 목록 query 는 진입 즉시 조회여도 loader 에서 기다리지 않는다(router.md 형태). 해소는 화면이 한 번 한다.
 */
export const Route = createFileRoute('/_app/ticketing/printers/')({
  validateSearch: printerListSearchContract.schema,
  beforeLoad: canonicalSearchGuard(printerListCanonicalSchema),
  component: PrinterListRoute,
});

function PrinterListRoute() {
  const navigate = Route.useNavigate();
  return (
    <PrinterListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
      onActivate={(printerId) => {
        void navigate({ to: '/ticketing/printers/$printerId', params: { printerId } });
      }}
      onCreate={() => {
        void navigate({ to: '/ticketing/printers/new' });
      }}
      onBulkChange={requestPrinterBulkChange}
      onCopy={requestPrinterCopy}
    />
  );
}
