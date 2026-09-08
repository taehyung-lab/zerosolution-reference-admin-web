import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { appealDataQuery } from "@/features/members/api/list-queries";
import {
  appealSearchSchema,
  appealSearchContract,
  resolveMemberRecordSearch,
} from "@/features/members/mechanics/record-list/model/member-record-search";
import { useMemberRecordRecipients } from "@/features/members/mechanics/record-list/model/useMemberRecordRecipients";
import { requestAppealBulkChange } from "@/features/members/screens/appeals/model/appeal-requests";
import { MemberAppealListScreen } from "@/features/members/screens/appeals/ui/MemberAppealListScreen";
import { requestMessageSend } from "@/features/messaging/screens/compose/model/message-request";
import { useMessageComposer } from "@/features/messaging/screens/compose/model/useMessageComposer";
import { MessageComposerDialog } from "@/features/messaging/screens/compose/ui/MessageComposerDialog";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/members/appeals/")({
  validateSearch: appealSearchSchema,
  beforeLoad: canonicalSearchGuard(appealSearchSchema),
  component: AppealsRoute,
});
function AppealsRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { message, openMessage, closeMessage } = useMessageComposer(
    useMemberRecordRecipients(
      resolveMemberRecordSearch(search, appealSearchContract),
      appealDataQuery,
    ),
  );
  // TRANSPLANT_PENDING_MEMBER_APPEALS_CONTRACT: bulk and messaging terminate at confirmed input.
  return (
    <>
      <MemberAppealListScreen
        search={search}
        onSearchChange={(search) => {
          void navigate({ search: () => appealSearchSchema.parse(search) });
        }}
        onActivate={(appealId) => {
          void navigate({
            to: "/members/appeals/$appealId",
            params: { appealId },
          });
        }}
        onMessage={openMessage}
        onBulkChange={requestAppealBulkChange}
      />
      <MessageComposerDialog
        onConfirm={requestMessageSend}
        request={message}
        onClose={closeMessage}
      />
    </>
  );
}
