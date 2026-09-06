import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { FormField } from "@/shared/ui/form/FormField";
import { FormRadioGroupField } from "@/shared/ui/form/FormRadioGroupField";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import { AlertDialog } from "@/shared/ui/patterns/AlertDialog";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import { Input } from "@/shared/ui/primitives/Input";
import { Button } from "@/shared/ui/primitives/Button";
import { MessageRecipients } from "./MessageRecipients";
import {
  confirmedMessage,
  formatPhoneNumber,
  messageDefaults,
  smsMessageSchema,
  type MessageDialogProps,
} from "./message-schema";

export function SmsDialog(props: MessageDialogProps) {
  const { t } = useTranslation("messaging");
  const { t: shared } = useTranslation("shared");
  if (!props.policy.enabled || !props.policy.channelEnabled)
    return (
      <AlertDialog
        open
        title={shared("alert.title")}
        description={t("messages.smsDisabled")}
        acknowledgeLabel={shared("formSave.acknowledge")}
        onOpenChange={(open) => {
          if (!open) props.onClose();
        }}
      />
    );
  return <SmsForm {...props} />;
}

function SmsForm({
  policy,
  recipients,
  onClose,
  onConfirm,
}: MessageDialogProps) {
  const { t } = useTranslation("messaging");
  const [defaultValues] = useState(() =>
    messageDefaults(
      { ...policy, senderAddress: formatPhoneNumber(policy.senderAddress) },
      recipients.map((recipient) => ({
        ...recipient,
        address: formatPhoneNumber(recipient.address),
      })),
    ),
  );
  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: smsMessageSchema },
    onSubmit: ({ value }) =>
      onConfirm(confirmedMessage(smsMessageSchema.parse(value))),
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
        title={t("messages.smsTitle")}
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
          <h2>{t("messages.recipients")}</h2>
          <MessageRecipients form={form} formatAddress={formatPhoneNumber} />
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
            label={t("messages.body")}
            required
          >
            {(field, control) => (
              <textarea
                {...control}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            )}
          </FormField>
          <Button type="submit">{t("messages.send")}</Button>
          <Button type="button" onClick={() => guard.close(onClose)}>
            {t("messages.cancel")}
          </Button>
        </form>
      </Dialog>
      {guard.dialog}
    </>
  );
}
