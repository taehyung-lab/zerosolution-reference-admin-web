import { messagePolicyFixture } from "@/features/messaging/fixtures/message-policy";
import { useDormantMemberMessage } from "@/features/members/dormant/useDormantMemberMessage";
import { createFileRoute } from "@tanstack/react-router";
import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { DormantMemberListScreen } from "@/features/members/dormant/DormantMemberListScreen";
import {
  dormantSearchSchema,
  memberRecordSearchSchema,
} from "@/features/members/records/member-record-search";
import { MessageDialog } from "@/features/messaging/MessageDialog";

export const Route = createFileRoute("/_app/members/dormant")({
  validateSearch: memberRecordSearchSchema,
  beforeLoad: canonicalSearchGuard(dormantSearchSchema),
  component: DormantRoute,
});
function DormantRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { message, openMessage, closeMessage } = useDormantMemberMessage();
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
