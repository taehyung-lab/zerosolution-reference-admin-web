import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import { Button } from "@/shared/ui/primitives/Button";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import {
  memberChangePasswordSchema,
  memberRevealSchema,
  memberVerificationFormSchema,
  memberVerifyWithdrawalSchema,
  type MemberDetailAction,
  type MemberDetailActionRequest,
} from "./member-detail-actions";

interface MemberActionDialogProps {
  readonly action: MemberDetailAction;
  readonly memberId: string;
  readonly onClose: () => void;
  readonly onRequest: (request: MemberDetailActionRequest) => void;
}

export function MemberActionDialog(props: MemberActionDialogProps) {
  return props.action === "password" ? (
    <PasswordDialog key={props.memberId} {...props} />
  ) : (
    <VerificationDialog key={`${props.memberId}:${props.action}`} {...props} />
  );
}

function PasswordDialog({
  memberId,
  onClose,
  onRequest,
}: MemberActionDialogProps) {
  const { t } = useTranslation("members");
  const element = useRef<HTMLFormElement>(null);
  const form = useForm({
    defaultValues: { password: "", passwordConfirmation: "" },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: memberChangePasswordSchema,
      onBlur: ({ value }) => ({
        fields: {
          passwordConfirmation:
            value.passwordConfirmation !== "" &&
            value.password !== value.passwordConfirmation
              ? t("detailAction.passwordMismatch")
              : undefined,
        },
      }),
    },
    onSubmit: ({ value }) => {
      const input = memberChangePasswordSchema.parse(value);
      onRequest({ kind: "password", memberId, password: input.password });
    },
    onSubmitInvalid: () =>
      element.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus(),
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
        title={t("detailAction.passwordTitle")}
        description={t("detailAction.passwordDescription")}
        closeLabel={t("detailAction.close")}
        onOpenChange={(open) => {
          if (!open) guard.close(onClose);
        }}
      >
        <form
          ref={element}
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            // Form checks field validity before rerunning form-level validators; refresh a prior blur mismatch for Enter submission.
            void form.validate("blur");
            void form.handleSubmit();
          }}
        >
          <FormTextField
            form={form}
            name="password"
            label={t("detailAction.password")}
            type="password"
            autoComplete="new-password"
            required
          />
          <FormTextField
            form={form}
            name="passwordConfirmation"
            label={t("detailAction.passwordConfirmation")}
            type="password"
            autoComplete="new-password"
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="submit">{t("detailAction.confirm")}</Button>
            <Button type="button" onClick={() => guard.close(onClose)}>
              {t("detailAction.cancel")}
            </Button>
          </div>
        </form>
      </Dialog>
      {guard.dialog}
    </>
  );
}

function VerificationDialog({
  action,
  memberId,
  onClose,
  onRequest,
}: MemberActionDialogProps) {
  const { t } = useTranslation("members");
  const element = useRef<HTMLFormElement>(null);
  const form = useForm({
    defaultValues: { reason: "", operatorPassword: "" },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic:
        action === "withdraw"
          ? memberVerifyWithdrawalSchema
          : memberVerificationFormSchema,
    },
    onSubmit: ({ value }) => {
      if (action === "withdraw") {
        const input = memberVerifyWithdrawalSchema.parse(value);
        onRequest({ kind: "verifyWithdrawal", memberId, ...input });
      } else {
        const input = memberRevealSchema.parse(value);
        onRequest({ kind: "reveal", memberId, ...input });
      }
    },
    onSubmitInvalid: () =>
      element.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus(),
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
        title={
          action === "withdraw"
            ? t("detailAction.withdrawTitle")
            : t("detailAction.revealTitle")
        }
        description={
          action === "withdraw"
            ? t("detailAction.withdrawDescription")
            : t("detailAction.revealDescription")
        }
        closeLabel={t("detailAction.close")}
        onOpenChange={(open) => {
          if (!open) guard.close(onClose);
        }}
      >
        <form
          ref={element}
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          {action === "withdraw" ? (
            <FormTextField
              form={form}
              name="reason"
              label={t("detailAction.reason")}
              placeholder={t("detailAction.reasonHint")}
              required
            />
          ) : null}
          <FormTextField
            form={form}
            name="operatorPassword"
            label={t("detailAction.operatorPassword")}
            type="password"
            autoComplete="current-password"
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="submit">{t("detailAction.confirm")}</Button>
            <Button type="button" onClick={() => guard.close(onClose)}>
              {t("detailAction.cancel")}
            </Button>
          </div>
        </form>
      </Dialog>
      {guard.dialog}
    </>
  );
}
