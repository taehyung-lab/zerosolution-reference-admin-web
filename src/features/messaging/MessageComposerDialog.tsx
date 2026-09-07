import { useId } from "react";
import { useTranslation } from "react-i18next";
import { AsyncFieldBoundary } from "@/shared/ui/patterns/AsyncFieldBoundary";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import type { MessageSendRequest } from "./message-request";
import { MessageFormDialog } from "./MessageFormDialog";
import { useMessagePolicy } from "./useMessagePolicy";
import type { MessageDialogProps, MessageRecipient } from "./message-schema";

/**
 * 회원·운영자 목록에서 선택한 여러 명 또는 상세 화면의 한 명에게 보낼 SMS·이메일 작성창.
 * 단순 알림창이 아니라 발신자·수신자·메시지 본문을 입력하고 검증하는 폼이다.
 * 호출 화면은 발송 채널과 수신자를 전달하며, 메시지 본문은 이 창에서 작성한다.
 * 발신자 기본값과 채널 사용 여부는 조회된 정책이 정한다. 정책이 도착하기 전에는 빈 발신자로 폼을 열지 않고
 * 같은 창 안에서 조회 중·실패·재시도를 보여 준다. 실제 발송 API는 연결되지 않았다.
 * onConfirm은 채널과 검증된 입력을 전달한다. 호출 화면이 requestMessageSend를 명시적으로 연결해 console.log로 요청 도달을 기록한다. 실제 발송 완료를 뜻하지 않는다.
 */
export function MessageComposerDialog({
  request,
  onClose,
  onConfirm,
}: {
  readonly request:
    | {
        readonly channel: "sms" | "email";
        readonly recipients: readonly MessageRecipient[];
      }
    | undefined;
  readonly onClose: MessageDialogProps["onClose"];
  readonly onConfirm: (request: MessageSendRequest) => void;
}) {
  const { t } = useTranslation("messaging");
  const policy = useMessagePolicy(request?.channel);
  const senderLabelId = useId();
  if (request === undefined) return null;
  if (policy.data === undefined)
    return (
      <Dialog
        open
        title={t(
          request.channel === "sms" ? "messages.smsTitle" : "messages.emailTitle",
        )}
        closeLabel={t("messages.close")}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <h2 id={senderLabelId}>{t("messages.sender")}</h2>
        <AsyncFieldBoundary
          state={policy.state === "ready" ? "loading" : "error"}
          labelledBy={senderLabelId}
          onRetry={() => {
            void policy.retry();
          }}
        >
          {null}
        </AsyncFieldBoundary>
      </Dialog>
    );
  return (
    <MessageFormDialog
      channel={request.channel}
      policy={policy.data}
      recipients={request.recipients}
      onClose={onClose}
      onConfirm={(values) => onConfirm({ ...values, channel: request.channel })}
    />
  );
}
