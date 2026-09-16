import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { printerDetailQueryOptions } from '@/features/ticketing/api/queries';
import { PrinterDetailScreen } from '@/features/ticketing/screens/printer-detail/ui/PrinterDetailScreen';

export const Route = createFileRoute('/_app/ticketing/printers/$printerId/')({
  loader: ({ context, params, preload }) =>
    loadRequired(
      context.queryClient,
      printerDetailQueryOptions(context.locale, params.printerId),
      { preload },
    ),
  component: PrinterDetailRoute,
});

function PrinterDetailRoute() {
  const { printerId } = Route.useParams();
  const navigate = Route.useNavigate();
  return (
    <PrinterDetailScreen
      key={printerId}
      printerId={printerId}
      onEdit={(id) => {
        void navigate({ to: '/ticketing/printers/$printerId/edit', params: { printerId: id } });
      }}
      onDeleted={() => {
        void navigate({ to: '/ticketing/printers' });
      }}
    />
  );
}
