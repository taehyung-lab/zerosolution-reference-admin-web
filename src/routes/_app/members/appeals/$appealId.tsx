import { messagePolicyFixture } from "@/features/messaging/fixtures/message-policy";
import { useAppealDetailMessage } from "@/features/members/appeals/useAppealDetailMessage";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { env } from "@/env";
import { AppealDetailScreen } from "@/features/members/appeals/AppealDetailScreen";
import { appealDetailFixture } from "@/features/members/fixtures/member-records";
import { MessageDialog } from "@/features/messaging/MessageDialog";
export const Route = createFileRoute("/_app/members/appeals/$appealId")({
  component: AppealRoute,
});
function AppealRoute() {
  const { appealId } = Route.useParams();
  const record = env.VITE_REFERENCE_SCENARIOS
    ? appealDetailFixture(appealId)
    : undefined;
  const { message, openMessage, closeMessage } = useAppealDetailMessage(record);
  if (!record) return notFound({ throw: true });
  // TRANSPLANT_PENDING_MEMBER_APPEAL_DETAIL_CONTRACT: saved result/notified/printer authority comes from the future API; callbacks never alter that baseline.
  return (
    <>
      <AppealDetailScreen
        record={record}
        memberHref={`/members/${record.memberId}`}
        onSave={() => undefined}
        onNotify={() => undefined}
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
