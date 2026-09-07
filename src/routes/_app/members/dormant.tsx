import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { dormantDataQuery } from "@/features/members/api/list-queries";
import {
  dormantSearchSchema,
  memberRecordSearchSchema,
} from "@/features/members/mechanics/record-list/model/member-record-search";
import { useMemberRecordRecipients } from "@/features/members/mechanics/record-list/model/useMemberRecordRecipients";
import { DormantMemberListScreen } from "@/features/members/screens/dormant/ui/DormantMemberListScreen";
import { requestMessageSend } from "@/features/messaging/screens/compose/model/message-request";
import { useMessageComposer } from "@/features/messaging/screens/compose/model/useMessageComposer";
import { MessageComposerDialog } from "@/features/messaging/screens/compose/ui/MessageComposerDialog";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/members/dormant")({
  // TODO(D3): this screen's own schema should validate the URL. Narrowing it makes `onSearchChange`
  // reject the wide value the shared record filter/result still produce, so those four record
  // surfaces have to become generic in the search type first. Until then the guard, not the type,
  // is what keeps a foreign field out of this screen.
  validateSearch: memberRecordSearchSchema,
  beforeLoad: canonicalSearchGuard(dormantSearchSchema),
  component: DormantRoute,
});
function DormantRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { message, openMessage, closeMessage } = useMessageComposer(
    useMemberRecordRecipients(search, dormantDataQuery),
  );
  // TRANSPLANT_PENDING_DORMANT_MESSAGE_CONTRACT: selected reference recipients stop at validated messaging input.
  return (
    <>
      <DormantMemberListScreen
        search={search}
        onSearchChange={(next) => {
          void navigate({ search: () => next });
        }}
        onActivate={(memberId) => {
          void navigate({ to: "/members/$memberId", params: { memberId } });
        }}
        onRegister={() => {
          void navigate({ to: "/members/new" });
        }}
        onMessage={openMessage}
      />
      <MessageComposerDialog
        onConfirm={requestMessageSend}
        request={message}
        onClose={closeMessage}
      />
    </>
  );
}
