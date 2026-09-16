import { createFileRoute } from '@tanstack/react-router';
import { requestPrinterCreate } from '@/features/ticketing/screens/printer-form/model/printer-form-requests';
import { PrinterCreateScreen } from '@/features/ticketing/screens/printer-form/ui/PrinterCreateScreen';

/** 선택지가 도메인 상수라 예열할 옵션 query 가 없다. 그래서 loader 도 없다. */
export const Route = createFileRoute('/_app/ticketing/printers/new')({
  component: PrinterCreateRoute,
});

function PrinterCreateRoute() {
  const navigate = Route.useNavigate();
  return (
    <PrinterCreateScreen
      onConfirm={requestPrinterCreate}
      onCancel={() => {
        void navigate({ to: '/ticketing/printers' });
      }}
    />
  );
}
