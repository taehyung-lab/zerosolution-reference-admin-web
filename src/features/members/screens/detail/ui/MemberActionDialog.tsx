/**
 * 비밀번호 변경·개인정보 조회 재인증·탈퇴 재인증에 필요한 입력과 확인을 처리한다.
 * API 이후에도 폼은 유지하지만 인증 성공을 클라이언트 검증만으로 판단하거나 개인정보를 해제하지 않는다.
 */
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import { Button } from "@/shared/ui/primitives/Button";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  memberChangePasswordSchema,
  memberRevealSchema,
  memberVerificationFormSchema,
  memberVerifyWithdrawalSchema,
  type MemberDetailAction,
  type MemberDetailActionRequest,
} from "../model/member-detail-actions";

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
          if (!open) guard.close(onClose, { when: false });
        }}
      >
        <form
          ref={element}
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            // Enter 제출 전에 이전 blur의 비밀번호 불일치 오류를 다시 검사해 정상 입력이 오래된 오류에 막히지 않게 한다.
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
            <Button
              type="button"
              onClick={() => guard.close(onClose, { when: false })}
            >
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
          if (!open) guard.close(onClose, { when: false });
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
            <Button
              type="button"
              onClick={() => guard.close(onClose, { when: false })}
            >
              {t("detailAction.cancel")}
            </Button>
          </div>
        </form>
      </Dialog>
      {guard.dialog}
    </>
  );
}
