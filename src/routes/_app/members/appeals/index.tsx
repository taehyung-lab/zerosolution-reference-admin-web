import { messagePolicyFixture } from "@/features/messaging/fixtures/message-policy";
import { useAppealListMessage } from "@/features/members/appeals/useAppealListMessage";
import { createFileRoute } from "@tanstack/react-router";
import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { MemberAppealListScreen } from "@/features/members/appeals/MemberAppealListScreen";
import {
  appealSearchSchema,
  memberRecordSearchSchema,
} from "@/features/members/records/member-record-search";
import { MessageDialog } from "@/features/messaging/MessageDialog";
export const Route = createFileRoute("/_app/members/appeals/")({
  validateSearch: memberRecordSearchSchema,
  beforeLoad: canonicalSearchGuard(appealSearchSchema),
  component: AppealsRoute,
});
function AppealsRoute() {
  const navigate = Route.useNavigate();
  const { message, openMessage, closeMessage } = useAppealListMessage();
  // TRANSPLANT_PENDING_MEMBER_APPEALS_CONTRACT: bulk and messaging terminate at confirmed input.
  return (
    <>
      <MemberAppealListScreen
        search={Route.useSearch()}
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
        onBulkChange={() => undefined}
      />
      {message ? (
        <MessageDialog
          channel={message.channel}
          policy={messagePolicyFixture(message.channel)}
          recipients={message.recipients}
          onClose={closeMessage}
          onConfirm={() => undefined}
        />
      ) : null}
    </>
  );
}
