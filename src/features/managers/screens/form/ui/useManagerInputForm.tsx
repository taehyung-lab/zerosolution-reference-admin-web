/**
 * API 미연결 운영자 입력 화면의 검증·dirty 보호·최종 확인을 공용 폼 UI에 연결한다.
 * 현재 저장 상태는 idle로 고정되어 실제 mutation workflow가 아니다. API 연결 시 검증은 유지하고 저장/오류/완료 상태 연결부를 교체한다.
 */
import { useConfirmation } from "@/shared/model/use-confirmation";
import { formFieldControlId } from "@/shared/ui/form/FormField";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import { useFormSections } from "@/shared/model/use-form-sections";
import { ConfirmDialog } from "@/shared/ui/patterns/ConfirmDialog";
import {
  revalidateLogic,
  useForm,
  useSelector,
  type DeepKeys,
} from "@tanstack/react-form";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import type { ManagerEditInput } from "../model/manager-form-schema";
import type { ManagerSaveForm } from "./ManagerForm";

/**
 * API 미연결 입력 경계이므로 실제 mutation 결과나 저장 완료 상태를 만들지 않는다.
 */
export function useManagerInputForm<TInput extends ManagerEditInput, TOutput>({
  schema,
  defaults,
  fieldOrder,
  onConfirm,
}: {
  readonly schema: z.ZodType<TOutput, TInput>;
  readonly defaults: TInput;
  readonly fieldOrder: readonly DeepKeys<TInput>[];
  readonly onConfirm: (values: TOutput) => void;
}): ManagerSaveForm<TInput, TOutput> {
  const { t } = useTranslation("shared");
  const { t: manager } = useTranslation("managers");
  const confirmation = useConfirmation({ run: onConfirm });
  const form = useForm({
    defaultValues: defaults,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
      onBlur: ({ value }) => ({
        fields: {
          passwordConfirm:
            "passwordConfirm" in value &&
            "password" in value &&
            value.passwordConfirm !== "" &&
            value.password !== value.passwordConfirm
              ? manager("form.errors.passwordMismatch")
              : undefined,
        },
      }),
    },
    onSubmit: ({ value }) =>
      confirmation.requestConfirmation(schema.parse(value)),
    onSubmitInvalid: ({ formApi }) => {
      const failed = fieldOrder.filter(
        (name) => formApi.getFieldMeta(name)?.errors.length,
      );
      flushSync(() => {
        sections.revealInvalid(failed);
      });
      if (failed[0])
        document
          .getElementById(formFieldControlId<TInput>(formApi, failed[0]))
          ?.focus();
    },
  });
  const invalidFields = useSelector(form.store, (state) =>
    Object.keys(state.fieldMeta).filter(
      (name) =>
        (state.fieldMeta[name as DeepKeys<TInput>]?.errors.length ?? 0) > 0,
    ),
  );
  const sections = useFormSections({ info: fieldOrder }, { invalidFields });
  const dirty = useSelector(
    form.store,
    (state) => state.isDirty && !state.isDefaultValue,
  );
  const guard = useUnsavedChangesGuard({ when: dirty });
  return {
    form,
    sections,
    guard,
    stage: { kind: "idle" },
    submit: {
      run: () => {
        void form.validate("blur");
        return form.handleSubmit();
      },
      isPending: false,
    },
    dialogs: (
      <>
        {guard.dialog}
        <ConfirmDialog
          open={confirmation.state.kind === "confirm"}
          title={t("alert.title")}
          description={t("formSave.confirmDescription")}
          confirmLabel={t("formSave.confirm")}
          cancelLabel={t("formSave.cancel")}
          onOpenChange={(open) => {
            if (!open) confirmation.close();
          }}
          onConfirm={confirmation.confirm}
        />
      </>
    ),
  };
}
