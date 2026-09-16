import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { memberDetailQueryOptions } from '@/features/members/api/queries';
import { MemberEditScreen } from '@/features/members/screens/member-form/ui/MemberEditScreen';

export const Route = createFileRoute('/_app/members/$memberId/edit')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, memberDetailQueryOptions(context.locale, params.memberId), { preload }),
  component: MemberEditRoute,
});

function MemberEditRoute() {
  const { memberId } = Route.useParams();
  const navigate = Route.useNavigate();
  const goToDetail = () => {
    void navigate({ to: '/members/$memberId', params: { memberId } });
  };
  return <MemberEditScreen key={memberId} memberId={memberId} onSaved={goToDetail} onCancel={goToDetail} />;
}
