import { i18n } from "@/shared/i18n/i18n";
import { formFieldControlId } from "@/shared/ui/form/FormField";
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import { Button } from "@/shared/ui/primitives/Button";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { managerPasswordSchema } from "../../../model/manager-password";
import type { ManagerDetailActionRequest } from "../model/manager-detail-actions";

type InputAction =
  "reject" | "password" | "unlock" | "reveal" | "verifyWithdrawal";
const requiredPassword = z
  .string()
  .min(1, { error: () => i18n.t("managers:actions.passwordRequired") });
const input = z.object({
  reason: z.string(),
  password: z.string(),
  passwordConfirm: z.string(),
  operatorPassword: z.string(),
});
const schemas = {
  reject: input.extend({
    reason: z
      .string()
      .min(1, { error: () => i18n.t("managers:actions.reasonRequired") }),
  }),
  password: input
    .extend({ password: managerPasswordSchema })
    .refine((value) => value.password === value.passwordConfirm, {
      path: ["passwordConfirm"],
      error: () => i18n.t("managers:form.errors.passwordMismatch"),
    }),
  unlock: input
    .extend({ password: managerPasswordSchema })
    .refine((value) => value.password === value.passwordConfirm, {
      path: ["passwordConfirm"],
      error: () => i18n.t("managers:form.errors.passwordMismatch"),
    }),
  reveal: input.extend({ operatorPassword: requiredPassword }),
  verifyWithdrawal: input.extend({
    reason: z.string().min(5, {
      error: () => i18n.t("managers:actions.withdrawalReasonError"),
    }),
    operatorPassword: requiredPassword,
  }),
};

/**
 * 운영자 상세 액션 하나의 입력·검증·이탈 방지를 소유하는 폼이다.
 * 실제 API에서도 입력 절차는 유지하며 해당 액션의 필드만 callback에 전달한다.
 */
export function ManagerActionForm({
  action,
  managerId,
  onClose,
  onActionRequest,
}: {
  readonly action: InputAction;
  readonly managerId: string;
  readonly onClose: () => void;
  readonly onActionRequest: (request: ManagerDetailActionRequest) => void;
}) {
  const { t } = useTranslation("managers");
  const { t: shared } = useTranslation("shared");
  const schema = schemas[action];
  const form = useForm({
    defaultValues: {
      reason: "",
      password: "",
      passwordConfirm: "",
      operatorPassword: "",
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
      onBlur: ({ value }) => ({
        fields: {
          passwordConfirm:
            (action === "password" || action === "unlock") &&
            value.passwordConfirm !== "" &&
            value.password !== value.passwordConfirm
              ? t("form.errors.passwordMismatch")
              : undefined,
        },
      }),
    },
    onSubmitInvalid: ({ formApi }) => {
      const first = (
        ["reason", "password", "passwordConfirm", "operatorPassword"] as const
      ).find((name) => formApi.getFieldMeta(name)?.errors.length);
      if (first)
        document
          .getElementById(
            formFieldControlId<typeof formApi.state.values>(formApi, first),
          )
          ?.focus();
    },
    onSubmit: ({ value }) => {
      // 현재 비밀번호 확인·재사용 검사와 탈퇴 재인증의 성공 여부는 서버가 판정한다.
      switch (action) {
        case "reject":
          onActionRequest({
            type: action,
            managerId,
            reason: schemas.reject.parse(value).reason,
          });
          break;
        case "password":
        case "unlock":
          onActionRequest({
            type: action,
            managerId,
            password: schemas[action].parse(value).password,
          });
          break;
        case "reveal":
          onActionRequest({
            type: action,
            managerId,
            operatorPassword: schemas.reveal.parse(value).operatorPassword,
          });
          break;
        case "verifyWithdrawal": {
          const parsed = schemas.verifyWithdrawal.parse(value);
          onActionRequest({
            type: action,
            managerId,
            reason: parsed.reason,
            operatorPassword: parsed.operatorPassword,
          });
          break;
        }
      }
    },
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
        onOpenChange={(open) => {
          if (!open) guard.close(onClose, { when: false });
        }}
        title={t(`actions.${action}`)}
        description={t(`actions.${action}Description`)}
        closeLabel={shared("formAction.cancel")}
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.validate("blur");
            void form.handleSubmit();
          }}
        >
          {action === "reject" || action === "verifyWithdrawal" ? (
            <FormTextField
              form={form}
              name="reason"
              label={t(
                action === "reject"
                  ? "actions.rejectionReason"
                  : "actions.withdrawalReason",
              )}
              required
            />
          ) : null}
          {action === "password" || action === "unlock" ? (
            <>
              <FormTextField
                form={form}
                name="password"
                label={t("form.password")}
                type="password"
                autoComplete="new-password"
                required
              />
              <FormTextField
                form={form}
                name="passwordConfirm"
                label={t("form.passwordConfirm")}
                type="password"
                autoComplete="new-password"
                required
              />
            </>
          ) : null}
          {action === "reveal" || action === "verifyWithdrawal" ? (
            <FormTextField
              form={form}
              name="operatorPassword"
              label={t("form.password")}
              type="password"
              autoComplete="current-password"
              required
            />
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="submit">
              {action === "reject"
                ? t("actions.rejectConfirm")
                : shared("formSave.confirm")}
            </Button>
            <Button
              type="button"
              onClick={() => guard.close(onClose, { when: false })}
            >
              {shared("formAction.cancel")}
            </Button>
          </div>
        </form>
      </Dialog>
      {guard.dialog}
    </>
  );
}
