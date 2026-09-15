/**
 * 회원 수정 초안·조건부 활동제한·검증·이탈 방지와 대상 ID를 포함한 확인 입력을 관리한다.
 * API 이후에도 필요하며 초기값 조회와 최종 저장은 외부 경계다. 숨긴 활동제한 초안 보존과 제출값 제외를 구분한다.
 */
import { formatDate } from "@/shared/lib/datetime";
import { useConfirmation } from "@/shared/model/use-confirmation";
import { FormCancelButton } from "@/shared/ui/form/FormCancelButton";
import { FormDateField } from "@/shared/ui/form/FormDateField";
import { formFieldControlId } from "@/shared/ui/form/FormField";
import { FormPermissionTreeField } from "@/shared/ui/form/FormPermissionTreeField";
import { FormSelectField } from "@/shared/ui/form/FormSelectField";
import { FormSubmitButton } from "@/shared/ui/form/FormSubmitButton";
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import { ConfirmDialog } from "@/shared/ui/dialog/ConfirmDialog";
import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { SectionCard } from "@/shared/ui/layout/SectionCard";
import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import { Activity } from "react";
import { useTranslation } from "react-i18next";
import {
  memberAccountStatuses,
  memberRestrictions,
} from "../../../model/account";
import { type MemberEditValues } from "../../../model/member-edit-values";
import {
  memberEditSchema,
  toMemberEditInput,
} from "../model/member-edit-schema";

const fieldOrder = [
  "accountStatus",
  "restrictions",
  "name",
  "birthDate",
  "phone",
] as const;

export function MemberEditScreen({
  memberId,
  email,
  initialValues,
  onConfirm,
  onCancel,
}: {
  readonly memberId: string;
  readonly email: string;
  readonly initialValues: MemberEditValues;
  readonly onConfirm: (request: {
    readonly memberId: string;
    readonly input: MemberEditValues;
  }) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation("members");
  const { t: shared } = useTranslation("shared");
  const confirmation = useConfirmation({
    run: (input: MemberEditValues) => onConfirm({ memberId, input }),
  });
  const form = useForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: memberEditSchema },
    onSubmit: ({ value }) =>
      confirmation.requestConfirmation(toMemberEditInput(value)),
    onSubmitInvalid: ({ formApi }) => {
      const first = fieldOrder.find(
        (name) => (formApi.getFieldMeta(name)?.errors.length ?? 0) > 0,
      );
      if (first === undefined) return;
      const control = document.getElementById(
        formFieldControlId<MemberEditValues>(form, first),
      );
      const target =
        first === "birthDate" || first === "restrictions"
          ? (control?.querySelector<HTMLElement>(
              '[role="grid"] button:not(:disabled)',
            ) ?? control?.querySelector<HTMLElement>("button:not(:disabled)"))
          : control;
      target?.focus();
    },
  });
  const accountStatus = useSelector(
    form.store,
    (state) => state.values.accountStatus,
  );
  const dirty = useSelector(
    form.store,
    (state) => state.isDirty && !state.isDefaultValue,
  );
  const guard = useUnsavedChangesGuard({ when: dirty });

  return (
    <>
      <PageHeader title={t("edit.title")} />
      {guard.dialog}
      <ConfirmDialog
        open={confirmation.state.kind === "confirm"}
        title={shared("alert.title")}
        description={shared("formSave.confirmDescription")}
        confirmLabel={shared("formSave.confirm")}
        cancelLabel={shared("formSave.cancel")}
        onOpenChange={(open) => {
          if (!open) confirmation.close();
        }}
        onConfirm={confirmation.confirm}
      />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <SectionCard title={t("form.section")} collapsible={false}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormSelectField
              form={form}
              name="accountStatus"
              label={t("filters.accountStatus")}
              required
              options={memberAccountStatuses.map((value) => ({
                value,
                label: t(`accountStatus.${value}`),
              }))}
            />
            <Activity mode={accountStatus === "flagged" ? "visible" : "hidden"}>
              <FormPermissionTreeField
                form={form}
                name="restrictions"
                label={t("filters.restrictions")}
                required
                nodes={memberRestrictions.map((value) => ({
                  value,
                  label: t(`restriction.${value}`),
                }))}
                selectAllLabel={t("filters.all")}
              />
            </Activity>
          </div>
          <div className="mt-4 space-y-4 md:w-1/2">
            <FormTextField readOnly label={t("form.email")} value={email} />
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
          <FormCancelButton onClick={() => guard.leave(onCancel)} />
        </div>
      </form>
    </>
  );
}
