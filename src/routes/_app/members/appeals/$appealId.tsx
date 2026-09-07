import {
  requestAppealNotify,
  requestAppealSave,
} from "@/features/members/screens/appeals/model/appeal-requests";
import { useAppealDetail } from "@/features/members/api/useAppealDetail";
import { AppealDetailScreen } from "@/features/members/screens/appeals/ui/AppealDetailScreen";
import { requestMessageSend } from "@/features/messaging/screens/compose/model/message-request";
import { useMessageComposer } from "@/features/messaging/screens/compose/model/useMessageComposer";
import { MessageComposerDialog } from "@/features/messaging/screens/compose/ui/MessageComposerDialog";
import { DetailStateBoundary } from "@/shared/ui/patterns/DetailStateBoundary";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/_app/members/appeals/$appealId")({
  component: AppealRoute,
});
function AppealRoute() {
  const { t: shared } = useTranslation("shared");
  const { appealId } = Route.useParams();
  const query = useAppealDetail(appealId);
  const record = query.data;
  const { message, openMessage, closeMessage } = useMessageComposer(
    (channel) =>
      record
        ? [
            {
              name: record.name,
              address: channel === "sms" ? record.phone : record.email,
            },
          ]
        : [],
  );
  if (record === undefined)
    return (
      <DetailStateBoundary
        state={query.state}
        labels={{
          error: shared("error.unexpected.body"),
          notFound: shared("error.notFound"),
        }}
        retryLabel={shared("error.unexpected.retry")}
        onRetry={() => {
          void query.retry();
        }}
      >
        {null}
      </DetailStateBoundary>
    );
  // TRANSPLANT_PENDING_MEMBER_APPEAL_DETAIL_CONTRACT: saved result/notified/printer authority comes from the future API; callbacks never alter that baseline.
  return (
    <>
      <AppealDetailScreen
        record={record}
        memberHref={`/members/${record.memberId}`}
        onSave={requestAppealSave}
        onNotify={requestAppealNotify}
        onMessage={(channel) => openMessage(channel, appealId)}
      />
      <MessageComposerDialog
        onConfirm={requestMessageSend}
        request={message}
        onClose={closeMessage}
      />
    </>
  );
}
