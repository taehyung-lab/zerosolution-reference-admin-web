import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { printerDetailQueryOptions } from '@/features/ticketing/api/queries';
import { requestPrinterEdit } from '@/features/ticketing/screens/printer-form/model/printer-form-requests';
import { PrinterEditScreen } from '@/features/ticketing/screens/printer-form/ui/PrinterEditScreen';

export const Route = createFileRoute('/_app/ticketing/printers/$printerId/edit')({
  loader: ({ context, params, preload }) =>
    loadRequired(
      context.queryClient,
      printerDetailQueryOptions(context.locale, params.printerId),
      { preload },
    ),
  component: PrinterEditRoute,
});

function PrinterEditRoute() {
  const { printerId } = Route.useParams();
  const navigate = Route.useNavigate();
  return (
    <PrinterEditScreen
      key={printerId}
      printerId={printerId}
      onConfirm={requestPrinterEdit}
      onCancel={() => {
        void navigate({ to: '/ticketing/printers/$printerId', params: { printerId } });
      }}
    />
  );
}
