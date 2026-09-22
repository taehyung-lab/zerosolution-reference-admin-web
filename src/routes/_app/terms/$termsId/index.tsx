import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { termsDetailQueryOptions } from '@/features/terms/api/queries';
import { TermsDetailScreen } from '@/features/terms/screens/terms-detail/ui/TermsDetailScreen';

export const Route = createFileRoute('/_app/terms/$termsId/')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, termsDetailQueryOptions(context.locale, params.termsId), { preload }),
  component: TermsDetailRoute,
});

function TermsDetailRoute() {
  const { termsId } = Route.useParams();
  const navigate = Route.useNavigate();
  return (
    <TermsDetailScreen
      key={termsId}
      termsId={termsId}
      onEdit={(id) => {
        void navigate({ to: '/terms/$termsId/edit', params: { termsId: id } });
      }}
      onDeleted={() => {
        void navigate({ to: '/terms' });
      }}
    />
  );
}
