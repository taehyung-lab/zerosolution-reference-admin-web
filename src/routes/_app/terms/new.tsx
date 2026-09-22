import { createFileRoute } from '@tanstack/react-router';
import { TermsCreateScreen } from '@/features/terms/screens/terms-form/ui/TermsCreateScreen';

export const Route = createFileRoute('/_app/terms/new')({
  component: TermsCreateRoute,
});

function TermsCreateRoute() {
  const navigate = Route.useNavigate();
  const goToList = () => {
    void navigate({ to: '/terms' });
  };
  return <TermsCreateScreen onSaved={goToList} onCancel={goToList} />;
}
