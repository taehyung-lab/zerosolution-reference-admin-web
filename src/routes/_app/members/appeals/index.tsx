import { useMessageComposer } from "@/features/messaging/useMessageComposer";
import { appealDataQuery } from "@/features/members/api/list-queries";
import { useMemberRecordRecipients } from "@/features/members/records/useMemberRecordRecipients";
import { requestMessageSend } from "@/features/messaging/message-request";
import { requestAppealBulkChange } from "@/features/members/appeals/appeal-requests";
import { createFileRoute } from "@tanstack/react-router";
import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { MemberAppealListScreen } from "@/features/members/appeals/MemberAppealListScreen";
import {
  appealSearchSchema,
  memberRecordSearchSchema,
} from "@/features/members/records/member-record-search";
import { MessageComposerDialog } from "@/features/messaging/MessageComposerDialog";
export const Route = createFileRoute("/_app/members/appeals/")({
  validateSearch: memberRecordSearchSchema,
  beforeLoad: canonicalSearchGuard(appealSearchSchema),
  component: AppealsRoute,
});
function AppealsRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { message, openMessage, closeMessage } = useMessageComposer(
    useMemberRecordRecipients(search, appealDataQuery),
  );
  // TRANSPLANT_PENDING_MEMBER_APPEALS_CONTRACT: bulk and messaging terminate at confirmed input.
  return (
    <>
      <MemberAppealListScreen
        search={search}
        onSearchChange={(search) => {
          void navigate({ search: () => search });
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
