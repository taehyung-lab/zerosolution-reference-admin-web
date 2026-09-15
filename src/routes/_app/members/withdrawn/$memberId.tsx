import { requestMemberActivityDelete } from "@/features/members/screens/detail/model/member-detail-requests";
import { useWithdrawnDetail } from "@/features/members/api/useWithdrawnDetail";
import { WithdrawnMemberDetailScreen } from "@/features/members/screens/withdrawn/ui/WithdrawnMemberDetailScreen";
import { DetailStateBoundary } from "@/shared/ui/detail/DetailStateBoundary";
import { loadRequired } from "@/app/router/required-loader";
import { withdrawnDetailQuery } from "@/features/members/api/detail-queries";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/_app/members/withdrawn/$memberId")({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, withdrawnDetailQuery(context.locale, params.memberId), { preload }),
  component: WithdrawnDetailRoute,
});
function WithdrawnDetailRoute() {
  const { t: shared } = useTranslation("shared");
  const { memberId } = Route.useParams();
  const query = useWithdrawnDetail(memberId);
  const member = query.data;
  if (member === undefined)
    return (
      <DetailStateBoundary
        state={query.state}
        labels={{
          error: shared("error.unexpected.body"),
          notFound: shared("error.kind.notFound"),
        }}
        retryLabel={shared("error.unexpected.retry")}
        onRetry={() => {
          void query.retry();
        }}
      >
        {null}
      </DetailStateBoundary>
    );
  // TRANSPLANT_PENDING_WITHDRAWN_ACTIVITY_CONTRACT: activity actions stop before the member API.
  return (
    <WithdrawnMemberDetailScreen
      member={member}
      onDeleteActivity={requestMemberActivityDelete}
    />
  );
}
