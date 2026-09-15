import { formatPhoneNumber } from "../lib/format-phone-number";
import type { MessageDialogProps } from "./message-dialog-props";
import { FormField } from "@/shared/ui/form/FormField";
import { FormRadioGroupField } from "@/shared/ui/form/FormRadioGroupField";
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import { AlertDialog } from "@/shared/ui/dialog/AlertDialog";
import { Button } from "@/shared/ui/primitives/Button";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import { Input } from "@/shared/ui/primitives/Input";
import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import {
  confirmedMessage,
  emailMessageSchema,
  messageDefaults,
  smsMessageSchema,
  type MessageDraft,
} from "../model/message-schema";
import { MessageRecipients } from "./MessageRecipients";
import { RichTextEditor } from "./RichTextEditor";

type Props = MessageDialogProps & { readonly channel: "sms" | "email" };

export function MessageFormDialog(props: Props) {
  const { t } = useTranslation("messaging");
  const { t: shared } = useTranslation("shared");
  if (!props.policy.enabled || !props.policy.channelEnabled)
    return (
      <AlertDialog
        open
        title={shared("alert.title")}
        description={t(
          props.channel === "sms"
            ? "messages.smsDisabled"
            : "messages.emailDisabled",
        )}
        acknowledgeLabel={shared("formSave.acknowledge")}
        onOpenChange={(open) => {
          if (!open) props.onClose();
        }}
      />
    );
  return <MessageForm key={props.channel} {...props} />;
}

function MessageForm({
  channel,
  policy,
  recipients,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation("messaging");
  const schema: z.ZodType<MessageDraft, MessageDraft> =
    channel === "sms" ? smsMessageSchema : emailMessageSchema;
  const [defaultValues] = useState(() =>
    channel === "sms"
      ? messageDefaults(
          { ...policy, senderAddress: formatPhoneNumber(policy.senderAddress) },
          recipients.map((recipient) => ({
            ...recipient,
            address: formatPhoneNumber(recipient.address),
          })),
        )
      : messageDefaults(policy, recipients),
  );
  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => onConfirm(confirmedMessage(schema.parse(value))),
  });
  const dirty = useSelector(
    form.store,
    (state) => state.isDirty && !state.isDefaultValue,
  );
  const guard = useUnsavedChangesGuard({ when: dirty });
  return (
    <>
      <Dialog
        open
        title={t(
          channel === "sms" ? "messages.smsTitle" : "messages.emailTitle",
        )}
        closeLabel={t("messages.close")}
        onOpenChange={(open) => {
          if (!open) guard.close(onClose);
        }}
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <h2>{t("messages.sender")}</h2>
          <FormTextField
            form={form}
            name="senderName"
            label={t("messages.senderName")}
            required
          />
          {channel === "sms" ? (
            <FormField
              form={form}
              name="senderAddress"
              label={t("messages.senderPhone")}
              required
            >
              {(field, control) => (
                <Input
                  {...control}
                  type="tel"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(formatPhoneNumber(event.target.value))
                  }
                />
              )}
            </FormField>
          ) : (
            <FormTextField
              form={form}
              name="senderAddress"
              label={t("messages.senderEmail")}
              required
            />
          )}
          <h2>{t("messages.recipients")}</h2>
          <MessageRecipients
            form={form}
            formatAddress={channel === "sms" ? formatPhoneNumber : undefined}
          />
          <h2>{t("messages.content")}</h2>
          <FormRadioGroupField
            form={form}
            name="messageType"
            label={t("messages.type")}
            options={[
              { value: "information", label: t("messages.information") },
              { value: "advertisement", label: t("messages.advertisement") },
            ]}
          />
          <FormField
            form={form}
            name="body"
            labelTarget={channel === "email" ? "group" : undefined}
            label={t("messages.body")}
            required
          >
            {(field, control, labelId) =>
              channel === "email" ? (
                <RichTextEditor
                  control={control}
                  labelId={labelId}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
              ) : (
                <textarea
                  {...control}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              )
            }
          </FormField>
          <Button type="submit">{t("messages.send")}</Button>
          <Button
            type="button"
            onClick={() => guard.close(onClose)}
          >
            {t("messages.cancel")}
          </Button>
        </form>
      </Dialog>
      {guard.dialog}
    </>
  );
}
