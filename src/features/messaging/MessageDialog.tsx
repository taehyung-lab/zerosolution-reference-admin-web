import { EmailDialog } from "./EmailDialog";
import { SmsDialog } from "./SmsDialog";
import type { MessageDialogProps } from "./message-schema";

export function MessageDialog({
  channel,
  recipients,
  onClose,
  onConfirm,
  policy,
}: MessageDialogProps & {
  readonly channel: "sms" | "email";
}) {
  const Composer = channel === "sms" ? SmsDialog : EmailDialog;
  return (
    <Composer
      policy={policy}
      recipients={recipients}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
