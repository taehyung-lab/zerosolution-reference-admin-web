import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { FormField } from "@/shared/ui/form/FormField";
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { FormSelectField } from "@/shared/ui/form/FormSelectField";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import type { AppealProcessing } from "./appeal-detail";
import { Button } from "@/shared/ui/primitives/Button";

export function AppealProcessingForm({
  processing,
  onSave,
}: {
  readonly processing: AppealProcessing;
  readonly onSave: (values: AppealProcessing) => void;
}) {
  const { t } = useTranslation("members");
  const { t: shared } = useTranslation("shared");
  const schema = z
    .object({
      status: z.enum(["waiting", "reviewing", "held", "completed"]),
      result: z.enum(["waiting", "completed", "rejected"]),
      reason: z.enum(["", "unclear", "insufficient", "other"]),
      direct: z.string(),
      opinion: z.string(),
    })
    .superRefine((value, context) => {
      if (
        ["held", "completed"].includes(value.status) &&
        value.result === "rejected"
      ) {
        if (value.reason === "")
          context.addIssue({
            code: "custom",
            path: ["reason"],
            message: t("secondary.appeal.required"),
          });
        if (value.reason === "other" && value.direct.trim() === "")
          context.addIssue({
            code: "custom",
            path: ["direct"],
            message: t("secondary.appeal.required"),
          });
      }
    });
  const form = useForm({
    defaultValues: processing,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => {
      const parsed = schema.parse(value);
      const result = ["held", "completed"].includes(parsed.status)
        ? parsed.result
        : "waiting";
      onSave({
        ...parsed,
        result,
        reason: result === "rejected" ? parsed.reason : "",
        direct:
          result === "rejected" && parsed.reason === "other"
            ? parsed.direct
            : "",
      });
    },
  });
  const values = useSelector(form.store, (state) => state.values);
  const dirty = useSelector(
    form.store,
    (state) => state.isDirty && !state.isDefaultValue,
  );
  const guard = useUnsavedChangesGuard({ when: dirty });
  return (
    <>
      {guard.dialog}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <FormSelectField
          form={form}
          name="status"
          label={t("secondary.fields.status")}
          options={["waiting", "reviewing", "held", "completed"].map(
            (value) => ({ value, label: t(`secondary.states.${value}`) }),
          )}
        />
        <FormSelectField
          form={form}
          name="result"
          label={t("secondary.fields.result")}
          disabled={!["held", "completed"].includes(values.status)}
          options={["waiting", "completed", "rejected"].map((value) => ({
            value,
            label: t(`secondary.states.${value}`),
          }))}
        />
        {["held", "completed"].includes(values.status) &&
        values.result === "rejected" ? (
          <>
            <FormSelectField
              form={form}
              name="reason"
              label={t("secondary.appeal.reason")}
              required
              placeholder={t("secondary.choose")}
              options={["unclear", "insufficient", "other"].map((value) => ({
                value,
                label: t(`secondary.appeal.${value}`),
              }))}
            />
            {values.reason === "other" ? (
              <FormTextField
                form={form}
                name="direct"
                label={t("secondary.appeal.direct")}
                required
              />
            ) : null}
          </>
        ) : null}
        <FormField
          form={form}
          name="opinion"
          label={t("secondary.appeal.opinion")}
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
        <Button type="submit">{shared("formAction.save")}</Button>
        <Button type="button" onClick={() => guard.close(() => form.reset())}>
          {shared("formAction.cancel")}
        </Button>
      </form>
    </>
  );
}
