import { requestManagerDetail } from "@/features/managers/screens/detail/model/manager-detail-requests";
import { useManagerDirectoryDetail } from "@/features/managers/api/useManagerDirectoryDetail";
import { ManagerDetailContent } from "@/features/managers/screens/detail/ui/ManagerDetailScreen";
import { requestMessageSend } from "@/features/messaging/screens/compose/model/message-request";
import { useMessageComposer } from "@/features/messaging/screens/compose/model/useMessageComposer";
import { MessageComposerDialog } from "@/features/messaging/screens/compose/ui/MessageComposerDialog";
import { DetailStateBoundary } from "@/shared/ui/patterns/DetailStateBoundary";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { Button } from "@/shared/ui/primitives/Button";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/managers/$managerId/")({
  component: ManagerDetailRoute,
});

function ManagerDetailRoute() {
  const { managerId } = Route.useParams();
  const { t } = useTranslation("managers");
  const { t: messaging } = useTranslation("messaging");
  const query = useManagerDirectoryDetail(managerId);
  const record = query.data;
  const messages = useMessageComposer((channel) =>
    record
      ? [
          {
            address:
              (channel === "sms" ? record.detail.phone : record.detail.email) ??
              "",
            name: record.detail.name ?? "",
          },
        ]
      : [],
  );
  if (record === undefined)
    return (
      <DetailStateBoundary
        state={query.state}
        labels={{ error: t("detail.error"), notFound: t("detail.notFound") }}
        retryLabel={t("result.retry")}
        onRetry={() => {
          void query.retry();
        }}
      >
        {null}
      </DetailStateBoundary>
    );
  // TRANSPLANT_PENDING_MANAGER_DETAIL_INPUT: no server mutation or fake result at this boundary.
  return (
    <section>
      <PageHeader
        title={t("detailTitle")}
        breadcrumbs={[t("path.settings"), t("path.managers"), t("path.detail")]}
        actions={
          <>
            <Button onClick={() => messages.openMessage("sms", managerId)}>
              {messaging("messages.smsTitle")}
            </Button>
            {record.accountStatus !== "awaiting" ? (
              <Button onClick={() => messages.openMessage("email", managerId)}>
                {messaging("messages.emailTitle")}
              </Button>
            ) : null}
          </>
        }
      />
      <MessageComposerDialog
        onConfirm={requestMessageSend}
        request={messages.message}
        onClose={messages.closeMessage}
      />
      <ManagerDetailContent
        onActionRequest={requestManagerDetail}
        key={managerId}
        managerId={managerId}
        manager={record.detail}
        accountStatus={record.accountStatus}
      />
    </section>
  );
}
