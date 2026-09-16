import { createFileRoute } from '@tanstack/react-router';
import { MemberCreateScreen } from '@/features/members/screens/member-form/ui/MemberCreateScreen';

export const Route = createFileRoute('/_app/members/new')({
  component: MemberCreateRoute,
});

function MemberCreateRoute() {
  const navigate = Route.useNavigate();
  const goToList = () => {
    void navigate({ to: '/members/active/all' });
  };
  return <MemberCreateScreen onSaved={goToList} onCancel={goToList} />;
}
