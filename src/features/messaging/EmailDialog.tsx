import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { FormField } from "@/shared/ui/form/FormField";
import { FormRadioGroupField } from "@/shared/ui/form/FormRadioGroupField";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import { AlertDialog } from "@/shared/ui/patterns/AlertDialog";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import { Button } from "@/shared/ui/primitives/Button";
import { MessageRecipients } from "./MessageRecipients";
import { RichTextEditor } from "./RichTextEditor";
import {
  confirmedMessage,
  messageDefaults,
  emailMessageSchema,
  type MessageDialogProps,
} from "./message-schema";

export function EmailDialog(props: MessageDialogProps) {
  const { t } = useTranslation("messaging");
  const { t: shared } = useTranslation("shared");
  if (!props.policy.enabled || !props.policy.channelEnabled)
    return (
      <AlertDialog
        open
        title={shared("alert.title")}
        description={t("messages.emailDisabled")}
        acknowledgeLabel={shared("formSave.acknowledge")}
        onOpenChange={(open) => {
          if (!open) props.onClose();
        }}
      />
    );
  return <EmailForm {...props} />;
}

function EmailForm({
  policy,
  recipients,
  onClose,
  onConfirm,
}: MessageDialogProps) {
  const { t } = useTranslation("messaging");
  const [defaultValues] = useState(() => messageDefaults(policy, recipients));
  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: emailMessageSchema },
    onSubmit: ({ value }) =>
      onConfirm(confirmedMessage(emailMessageSchema.parse(value))),
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
        title={t("messages.emailTitle")}
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
          <FormTextField
            form={form}
            name="senderAddress"
            label={t("messages.senderEmail")}
            required
          />
          <h2>{t("messages.recipients")}</h2>
          <MessageRecipients form={form} />
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
            labelTarget="group"
            required
          >
            {(field, control, labelId) => (
              <RichTextEditor
                control={control}
                labelId={labelId}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
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
