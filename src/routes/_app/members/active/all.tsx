import { useMessageComposer } from "@/features/messaging/useMessageComposer";
import { useMemberListRecipients } from "@/features/members/list/model/useMemberListRecipients";
import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { requestMemberBulkChange } from "@/features/members/list/model/member-list-requests";
import { AllMemberListScreen } from "@/features/members/list/MemberListScreen";
import {
  allMemberCanonicalSearchSchema,
  memberSearchSchema,
  type MemberRouteSearch,
} from "@/features/members/list/model/search-schema";
import { requestMessageSend } from "@/features/messaging/message-request";
import { MessageComposerDialog } from "@/features/messaging/MessageComposerDialog";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/members/active/all")({
  validateSearch: memberSearchSchema,
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
