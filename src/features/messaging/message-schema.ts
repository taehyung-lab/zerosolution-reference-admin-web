import { z } from "zod";
import { i18n } from "@/shared/i18n/i18n";

export interface MessagePolicy {
  readonly enabled: boolean;
  readonly channelEnabled: boolean;
  readonly senderName: string;
  readonly senderAddress: string;
}
export interface MessageRecipient {
  readonly address: string;
  readonly name?: string;
}
export interface MessageValues {
  readonly senderName: string;
  readonly senderAddress: string;
  readonly recipients: readonly MessageRecipient[];
  readonly messageType: "information" | "advertisement";
  readonly body: string;
}
export interface MessageDialogProps {
  readonly policy: MessagePolicy;
  readonly recipients: readonly MessageRecipient[];
  readonly onClose: () => void;
  readonly onConfirm: (values: MessageValues) => void;
}

const error = (key: string) => ({
  error: () => i18n.t(`messaging:messages.errors.${key}`),
});
const email = z
  .string()
  .regex(/^[A-Za-z0-9@._-]+$/, error("email"))
  .pipe(z.email(error("email")));
const phone = z.string().regex(/^[0-9]+(?:-[0-9]+)*$/, error("phone"));
const common = {
  senderName: z.string().trim().min(1, error("name")).max(20, error("name")),
  messageType: z.enum(["information", "advertisement"]),
  body: z.string().refine((value) => value.trim().length > 0, error("body")),
};
const recipient = { key: z.string(), name: z.string() };
export const smsMessageSchema = z.object({
  ...common,
  senderAddress: phone,
  recipients: z
    .array(z.object({ ...recipient, address: phone }))
    .min(1, error("recipients")),
});
export const emailMessageSchema = z.object({
  ...common,
  senderAddress: email,
  recipients: z
    .array(z.object({ ...recipient, address: email }))
    .min(1, error("recipients")),
  body: z.string().refine((value) => {
    const document = new DOMParser().parseFromString(value, "text/html");
    return (document.body.textContent ?? "").trim().length > 0;
  }, error("body")),
});
export type MessageDraft = z.input<typeof smsMessageSchema>;

export function messageDefaults(
  policy: MessagePolicy,
  recipients: readonly MessageRecipient[],
): MessageDraft {
  return {
    senderName: policy.senderName,
    senderAddress: policy.senderAddress,
    recipients: recipients.map((recipient) => ({
      ...recipient,
      name: recipient.name ?? "",
      key: crypto.randomUUID(),
    })),
    messageType: "information",
    body: "",
  };
}

export function confirmedMessage(values: MessageDraft): MessageValues {
  return {
    ...values,
    recipients: values.recipients.map(({ address, name }) => ({
      address,
      ...(name === "" ? {} : { name }),
    })),
  };
}

export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, -4)}-${digits.slice(-4)}`;
  return `${digits.slice(0, -8)}-${digits.slice(-8, -4)}-${digits.slice(-4)}`;
}
