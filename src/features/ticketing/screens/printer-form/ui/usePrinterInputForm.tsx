/**
 * API 미연결 스마트프린터 입력 화면의 검증·dirty 이탈 보호·최종 확인을 한 곳에서 연결한다.
 * 저장 성공 상태는 만들지 않는다(`mutation-actions.md#api-연결-전-시나리오-요청`).
 * 섹션은 접히지 않는 하나(`기본정보`)뿐이라 `useFormSections` 의 오류 펼치기가 필요하지 않다.
 */
import type { PrinterSettings } from '@/features/ticketing/model/printer';
import { useConfirmation } from '@/shared/model/use-confirmation';
import { formFieldControlId } from '@/shared/ui/form/FormField';
import { useUnsavedChangesGuard } from '@/shared/ui/form/UnsavedChangesGuard';
import { ConfirmDialog } from '@/shared/ui/dialog/ConfirmDialog';
import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { toPrinterSettings } from '../model/printer-form-defaults';
import {
  printerFormFieldOrder,
  printerFormSchema,
  type PrinterFormInput,
} from '../model/printer-form-schema';

export function usePrinterInputForm({
  defaults,
  onConfirm,
}: {
  readonly defaults: PrinterFormInput;
  readonly onConfirm: (values: PrinterSettings) => void;
}) {
  const { t } = useTranslation('shared');
  const confirmation = useConfirmation({ run: onConfirm });
  const form = useForm({
    defaultValues: defaults,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: printerFormSchema },
    onSubmit: ({ value }) =>
      confirmation.requestConfirmation(toPrinterSettings(printerFormSchema.parse(value))),
    onSubmitInvalid: ({ formApi }) => {
      const first = printerFormFieldOrder.find(
        (name) => (formApi.getFieldMeta(name)?.errors.length ?? 0) > 0,
      );
      if (first === undefined) return;
      document.getElementById(formFieldControlId<PrinterFormInput>(formApi, first))?.focus();
    },
  });
  const dirty = useSelector(form.store, (state) => state.isDirty && !state.isDefaultValue);
  const guard = useUnsavedChangesGuard({ when: dirty });

  return {
    form,
    guard,
    submit: () => void form.handleSubmit(),
    dialogs: (
      <>
        {guard.dialog}
        <ConfirmDialog
          open={confirmation.state.kind === 'confirm'}
          title={t('alert.title')}
          description={t('formSave.confirmDescription')}
          confirmLabel={t('formSave.confirm')}
          cancelLabel={t('formSave.cancel')}
          onOpenChange={(open) => {
            if (!open) confirmation.close();
          }}
          onConfirm={confirmation.confirm}
        />
      </>
    ),
  };
}

export type PrinterInputForm = ReturnType<typeof usePrinterInputForm>;
