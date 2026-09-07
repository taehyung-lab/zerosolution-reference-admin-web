import { useMessageComposer } from "@/features/messaging/useMessageComposer";
import { useMemberListRecipients } from "@/features/members/list/model/useMemberListRecipients";
import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { requestMemberBulkChange } from "@/features/members/list/model/member-list-requests";
import { GeneralMemberListScreen } from "@/features/members/list/MemberListScreen";
import {
  generalMemberCanonicalSearchSchema,
  memberSearchSchema,
  type MemberRouteSearch,
} from "@/features/members/list/model/search-schema";
import { requestMessageSend } from "@/features/messaging/message-request";
import { MessageComposerDialog } from "@/features/messaging/MessageComposerDialog";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/members/active/general")({
  validateSearch: memberSearchSchema,
  beforeLoad: canonicalSearchGuard(generalMemberCanonicalSearchSchema),
  component: GeneralMemberListRoute,
});

function GeneralMemberListRoute() {
  const search = generalMemberCanonicalSearchSchema.parse(Route.useSearch());
  const navigate = Route.useNavigate();
  const actions = useMessageComposer(useMemberListRecipients(search, "general"));
  return (
    <>
      <MessageComposerDialog
        onConfirm={requestMessageSend}
        request={actions.message}
        onClose={actions.closeMessage}
      />

      <GeneralMemberListScreen
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
