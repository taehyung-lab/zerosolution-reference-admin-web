import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { requestMemberBulkChange } from "@/features/members/screens/list/model/member-list-requests";
import {
  allMemberCanonicalSearchSchema,
  type MemberRouteSearch,
} from "@/features/members/screens/list/model/search-schema";
import { useMemberListRecipients } from "@/features/members/screens/list/model/useMemberListRecipients";
import { AllMemberListScreen } from "@/features/members/screens/list/ui/MemberListScreen";
import { requestMessageSend } from "@/features/messaging/screens/compose/model/message-request";
import { useMessageComposer } from "@/features/messaging/screens/compose/model/useMessageComposer";
import { MessageComposerDialog } from "@/features/messaging/screens/compose/ui/MessageComposerDialog";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/members/active/all")({
  validateSearch: allMemberCanonicalSearchSchema,
  beforeLoad: canonicalSearchGuard(allMemberCanonicalSearchSchema),
  component: AllMemberListRoute,
});

function AllMemberListRoute() {
  const search = allMemberCanonicalSearchSchema.parse(Route.useSearch());
  const navigate = Route.useNavigate();
  const actions = useMessageComposer(useMemberListRecipients(search, "all"));

  return (
    <>
      {/* 메시지(sms, email) 작성 다이얼로그 */}
      <MessageComposerDialog
        onConfirm={requestMessageSend}
        request={actions.message}
        onClose={actions.closeMessage}
      />

      <AllMemberListScreen
        onActionRequest={(request) => {
          if (request.type === "bulkChange") requestMemberBulkChange(request);
          else actions.openMessage(request.type, request.targetIds);
        }}
        search={search}
        onSearchChange={(next: MemberRouteSearch) => {
          void navigate({
            search: () => allMemberCanonicalSearchSchema.parse(next),
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
