import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { requestMemberBulkChange } from "@/features/members/screens/list/model/member-list-requests";
import {
  flaggedMemberCanonicalSearchSchema,
  type MemberRouteSearch,
} from "@/features/members/screens/list/model/search-schema";
import { useMemberListRecipients } from "@/features/members/screens/list/model/useMemberListRecipients";
import { FlaggedMemberListScreen } from "@/features/members/screens/list/ui/MemberListScreen";
import { requestMessageSend } from "@/features/messaging/screens/compose/model/message-request";
import { useMessageComposer } from "@/features/messaging/screens/compose/model/useMessageComposer";
import { MessageComposerDialog } from "@/features/messaging/screens/compose/ui/MessageComposerDialog";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/members/active/flagged")({
  validateSearch: flaggedMemberCanonicalSearchSchema,
  beforeLoad: canonicalSearchGuard(flaggedMemberCanonicalSearchSchema),
  component: FlaggedMemberListRoute,
});

function FlaggedMemberListRoute() {
  const search = flaggedMemberCanonicalSearchSchema.parse(Route.useSearch());
  const navigate = Route.useNavigate();
  const actions = useMessageComposer(
    useMemberListRecipients(search, "flagged"),
  );

  return (
    <>
      <MessageComposerDialog
        onConfirm={requestMessageSend}
        request={actions.message}
        onClose={actions.closeMessage}
      />

      <FlaggedMemberListScreen
        onActionRequest={(request) => {
          if (request.type === "bulkChange") requestMemberBulkChange(request);
          else actions.openMessage(request.type, request.targetIds);
        }}
        search={search}
        onSearchChange={(next: MemberRouteSearch) => {
          void navigate({
            search: () => flaggedMemberCanonicalSearchSchema.parse(next),
          });
        }}
        onMemberActivate={(memberId) => {
          void navigate({ to: "/members/$memberId", params: { memberId } });
        }}
        onRegister={() => {
          void navigate({ to: "/members/new" });
        }}
      />
    </>
  );
}
