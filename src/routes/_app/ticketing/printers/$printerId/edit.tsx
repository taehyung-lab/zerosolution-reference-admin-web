import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { printerDetailQueryOptions } from '@/features/ticketing/api/queries';
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
  const goToDetail = () => {
    void navigate({ to: '/ticketing/printers/$printerId', params: { printerId } });
  };
  return (
    <PrinterEditScreen
      key={printerId}
      printerId={printerId}
      onSaved={goToDetail}
      onCancel={goToDetail}
    />
  );
}
