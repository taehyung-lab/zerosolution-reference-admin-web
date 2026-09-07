import { useMessageComposer } from "@/features/messaging/useMessageComposer";
import { useMemberListRecipients } from "@/features/members/list/model/useMemberListRecipients";
import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { requestMemberBulkChange } from "@/features/members/list/model/member-list-requests";
import { FlaggedMemberListScreen } from "@/features/members/list/MemberListScreen";
import {
  flaggedMemberCanonicalSearchSchema,
  memberSearchSchema,
  type MemberRouteSearch,
} from "@/features/members/list/model/search-schema";
import { requestMessageSend } from "@/features/messaging/message-request";
import { MessageComposerDialog } from "@/features/messaging/MessageComposerDialog";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/members/active/flagged")({
  validateSearch: memberSearchSchema,
  beforeLoad: canonicalSearchGuard(flaggedMemberCanonicalSearchSchema),
  component: FlaggedMemberListRoute,
});

function FlaggedMemberListRoute() {
  const search = flaggedMemberCanonicalSearchSchema.parse(Route.useSearch());
  const navigate = Route.useNavigate();
  const actions = useMessageComposer(useMemberListRecipients(search, "flagged"));

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
          void navigate({ search: () => next });
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
