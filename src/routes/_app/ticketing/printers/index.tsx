import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { printerListSearch } from '@/features/ticketing/screens/printer-list/model/printer-list-search';
import { PrinterListScreen } from '@/features/ticketing/screens/printer-list/ui/PrinterListScreen';

/**
 * 선택지가 전부 도메인 상수라 예열할 옵션 query 가 없고, 목록 query 는 진입 즉시 조회여도 loader 에서
 * 기다리지 않는다. URL 해소는 화면이 한 번 한다.
 */
export const Route = createFileRoute('/_app/ticketing/printers/')({
  validateSearch: printerListSearch.schema,
  beforeLoad: canonicalSearchGuard(printerListSearch.canonical),
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
    />
  );
}
