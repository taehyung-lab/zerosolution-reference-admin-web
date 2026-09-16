import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { withdrawnDetailQueryOptions } from '@/features/members/api/queries';
import { WithdrawnMemberDetailScreen } from '@/features/members/screens/member-withdrawn-detail/ui/WithdrawnMemberDetailScreen';

export const Route = createFileRoute('/_app/members/withdrawn/$memberId')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, withdrawnDetailQueryOptions(context.locale, params.memberId), { preload }),
  component: WithdrawnDetailRoute,
});

function WithdrawnDetailRoute() {
  const { memberId } = Route.useParams();
  return <WithdrawnMemberDetailScreen key={memberId} memberId={memberId} />;
}
