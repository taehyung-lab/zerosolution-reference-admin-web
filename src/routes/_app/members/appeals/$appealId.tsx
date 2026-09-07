import { useTranslation } from "react-i18next";
import { useAppealDetail } from "@/features/members/appeals/useAppealDetail";
import { DetailStateBoundary } from "@/shared/ui/patterns/DetailStateBoundary";
import { requestMessageSend } from "@/features/messaging/message-request";
import {
  requestAppealSave,
  requestAppealNotify,
} from "@/features/members/appeals/appeal-requests";
import { useMessageComposer } from "@/features/messaging/useMessageComposer";
import { createFileRoute } from "@tanstack/react-router";
import { AppealDetailScreen } from "@/features/members/appeals/AppealDetailScreen";
import { MessageComposerDialog } from "@/features/messaging/MessageComposerDialog";
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
  if (record === undefined) return <DetailStateBoundary state={query.state} labels={{ error: shared('error.unexpected.body'), notFound: shared('error.notFound') }} retryLabel={shared('error.unexpected.retry')} onRetry={() => { void query.retry(); }}>{null}</DetailStateBoundary>;
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
