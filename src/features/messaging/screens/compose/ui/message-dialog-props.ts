import type { MessagePolicy, MessageRecipient, MessageValues } from "../../../model/message";

export interface MessageDialogProps {
  readonly policy: MessagePolicy;
  readonly recipients: readonly MessageRecipient[];
  readonly onClose: () => void;
  readonly onConfirm: (values: MessageValues) => void;
}
