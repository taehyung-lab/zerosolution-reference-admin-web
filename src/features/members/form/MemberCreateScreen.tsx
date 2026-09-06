import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/shared/lib/datetime";
import { FormCancelButton } from "@/shared/ui/form/FormCancelButton";
import { FormDateField } from "@/shared/ui/form/FormDateField";
import { formFieldControlId } from "@/shared/ui/form/FormField";
import { FormSubmitButton } from "@/shared/ui/form/FormSubmitButton";
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import { ConfirmDialog } from "@/shared/ui/patterns/ConfirmDialog";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { SectionCard } from "@/shared/ui/patterns/SectionCard";
import {
  memberCreateDefaults,
  memberCreateFieldOrder,
  memberCreateSchema,
  type MemberCreateValues,
} from "./member-create-schema";

export function MemberCreateScreen({
  onConfirm,
}: {
  readonly onConfirm: (values: MemberCreateValues) => void;
}) {
  const { t } = useTranslation("members");
  const { t: shared } = useTranslation("shared");
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<MemberCreateValues>();
  const form = useForm({
    defaultValues: memberCreateDefaults,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: memberCreateSchema },
    onSubmit: ({ value }) => setCandidate(memberCreateSchema.parse(value)),
    onSubmitInvalid: ({ formApi }) => {
      const first = memberCreateFieldOrder.find(
        (name) => (formApi.getFieldMeta(name)?.errors.length ?? 0) > 0,
      );
      if (first === undefined) return;
      const control = document.getElementById(
        formFieldControlId<MemberCreateValues>(form, first),
      );
      if (first === "birthDate") {
        const target =
          control?.querySelector<HTMLButtonElement>(
            '[role="grid"] button:not(:disabled)',
          ) ??
          control?.querySelector<HTMLButtonElement>("button:not(:disabled)");
        target?.focus();
      } else control?.focus();
    },
  });
  const dirty = useSelector(
    form.store,
    (state) => state.isDirty && !state.isDefaultValue,
  );
  const guard = useUnsavedChangesGuard({ when: dirty });

  return (
    <>
      <PageHeader title={t("form.createTitle")} />
      {guard.dialog}
      <ConfirmDialog
        open={candidate !== undefined}
        title={shared("alert.title")}
        description={shared("formSave.confirmDescription")}
        confirmLabel={shared("formSave.confirm")}
        cancelLabel={shared("formSave.cancel")}
        onOpenChange={(open) => {
          if (!open) setCandidate(undefined);
        }}
        onConfirm={() => {
          if (candidate === undefined) return;
          setCandidate(undefined);
          onConfirm(candidate);
        }}
      />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <SectionCard title={t("form.section")} collapsible={false}>
          <div className="space-y-4 md:w-1/2">
            <FormTextField
              form={form}
              name="email"
              label={t("form.email")}
              required
              autoComplete="email"
            />
            <FormTextField
              form={form}
              name="password"
              label={t("form.password")}
              required
              type="password"
              autoComplete="new-password"
            />
            <FormTextField
              form={form}
              name="name"
              label={t("form.name")}
              required
            />
            <FormDateField
              form={form}
              name="birthDate"
              label={t("form.birthDate")}
              required
              max={formatDate(new Date().toISOString())}
            />
            <FormTextField
              form={form}
              name="phone"
              label={t("form.phone")}
              required
              type="tel"
              autoComplete="tel"
            />
          </div>
        </SectionCard>
        <div className="mt-6 flex justify-center gap-2">
          <FormSubmitButton pending={false} />
          <FormCancelButton
            onClick={() =>
              guard.leave(() => {
                void navigate({ to: "/members/active/all" });
              })
            }
          />
        </div>
      </form>
    </>
  );
}
