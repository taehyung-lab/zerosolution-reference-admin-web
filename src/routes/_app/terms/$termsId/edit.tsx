import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { termsDetailQueryOptions } from '@/features/terms/api/queries';
import { TermsEditScreen } from '@/features/terms/screens/terms-form/ui/TermsEditScreen';

export const Route = createFileRoute('/_app/terms/$termsId/edit')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, termsDetailQueryOptions(context.locale, params.termsId), { preload }),
  component: TermsEditRoute,
});

function TermsEditRoute() {
  const { termsId } = Route.useParams();
  const navigate = Route.useNavigate();
  const goToDetail = () => {
    void navigate({ to: '/terms/$termsId', params: { termsId } });
  };
  return <TermsEditScreen key={termsId} termsId={termsId} onSaved={goToDetail} onCancel={goToDetail} />;
}
