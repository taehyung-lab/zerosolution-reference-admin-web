import { useTranslation } from "react-i18next";
import { useWithdrawnDetail } from "@/features/members/withdrawn/useWithdrawnDetail";
import { DetailStateBoundary } from "@/shared/ui/patterns/DetailStateBoundary";
import { requestMemberActivityDelete } from '@/features/members/detail/member-detail-requests';
import { createFileRoute } from "@tanstack/react-router";
import { WithdrawnMemberDetailScreen } from "@/features/members/withdrawn/WithdrawnMemberDetailScreen";
export const Route = createFileRoute("/_app/members/withdrawn/$memberId")({
  component: WithdrawnDetailRoute,
});
function WithdrawnDetailRoute() {
  const { t: shared } = useTranslation("shared");
  const { memberId } = Route.useParams();
  const query = useWithdrawnDetail(memberId);
  const member = query.data;
  if (member === undefined) return <DetailStateBoundary state={query.state} labels={{ error: shared('error.unexpected.body'), notFound: shared('error.notFound') }} retryLabel={shared('error.unexpected.retry')} onRetry={() => { void query.retry(); }}>{null}</DetailStateBoundary>;
  // TRANSPLANT_PENDING_WITHDRAWN_ACTIVITY_CONTRACT: activity actions stop before the member API.
  return (
    <WithdrawnMemberDetailScreen
      member={member}
      onDeleteActivity={requestMemberActivityDelete}
    />
  );
}
