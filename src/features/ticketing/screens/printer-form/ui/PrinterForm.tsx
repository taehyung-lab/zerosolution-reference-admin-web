/**
 * 스마트프린터 등록·수정 폼 — Figma 6.7.1.3 등록 / 6.7.1.3.1 Case / 6.7.1.4 수정 frame 의 `기본정보`
 * 섹션을 화면 순서대로 조립한다(2026-09-15 aside 렌더 실측). 두 frame 의 항목·필수·선택지가 같아
 * 등록·수정이 이 조립을 그대로 공유하고, 기본값·요청 mapper·저장 목적지는 각 화면이 소유한다.
 *
 * `조치사항` 은 frame 이 여러 줄 입력으로 그린다. 공용 form adapter 목록(form-fields.md)에 textarea 가
 * 없고 한 소비자 때문에 공용 어휘를 늘리지 않으므로, 공용 `FormField` 의 field/control 계약 위에
 * feature-local 여러 줄 입력을 조립한다.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PRINTER_MODEL_MAX_LENGTH,
  PRINTER_NAME_MAX_LENGTH,
  PRINTER_SERIAL_NO_MAX_LENGTH,
  printerPurposes,
  printerStatuses,
  printerUsages,
} from '@/features/ticketing/model/printer';
import { FormCancelButton } from '@/shared/ui/form/FormCancelButton';
import { FormDateField } from '@/shared/ui/form/FormDateField';
import { FormField, type FieldForm } from '@/shared/ui/form/FormField';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormSubmitButton } from '@/shared/ui/form/FormSubmitButton';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import type { PrinterFormInput } from '../model/printer-form-schema';
import type { PrinterInputForm } from './usePrinterInputForm';

export function PrinterForm({
  form,
  onSubmit,
  onCancel,
  dialogs,
}: {
  readonly form: PrinterInputForm['form'];
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  /** 저장 확인·이탈 확인 dialog. 폼이 렌더해 blocker 만 있고 dialog 가 없는 상태를 만들지 않는다. */
  readonly dialogs: ReactNode;
}) {
  const { t } = useTranslation('ticketing');
  const statusOptions = printerStatuses.map((value) => ({
    value,
    label: t(`printer.values.status.${value}`),
  }));
  const purposeOptions = printerPurposes.map((value) => ({
    value,
    label: t(`printer.values.purpose.${value}`),
  }));
  const usageOptions = printerUsages.map((value) => ({
    value,
    label: t(`printer.values.usage.${value}`),
  }));

  return (
    <>
      {dialogs}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <SectionCard title={t('printer.form.section')}>
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            <FormTextField
              form={form}
              label={t('printer.form.name')}
              name="name"
              placeholder={t('printer.form.namePlaceholder', { max: PRINTER_NAME_MAX_LENGTH })}
              required
            />
            <FormTextField
              form={form}
              label={t('printer.form.serialNo')}
              name="serialNo"
              placeholder={t('printer.form.serialNoPlaceholder', {
                max: PRINTER_SERIAL_NO_MAX_LENGTH,
              })}
              required
            />
            <FormTextField
              form={form}
              label={t('printer.form.model')}
              name="model"
              placeholder={t('printer.form.modelPlaceholder', { max: PRINTER_MODEL_MAX_LENGTH })}
            />
            <FormTextField
              form={form}
              label={t('printer.form.manufacturer')}
              name="manufacturer"
            />
            <FormDateField form={form} label={t('printer.form.purchasedAt')} name="purchasedAt" />
            <div aria-hidden="true" className="hidden md:block" />
            <FormTextField form={form} label={t('printer.form.location')} name="location" />
            <FormSelectField
              form={form}
              label={t('printer.form.status')}
              name="status"
              options={statusOptions}
              required
            />
            <div className="md:col-span-2">
              <PrinterMeasuresField form={form} label={t('printer.form.measures')} />
            </div>
            <FormSelectField
              form={form}
              label={t('printer.form.purpose')}
              name="purpose"
              options={purposeOptions}
              required
            />
            <FormSelectField
              form={form}
              label={t('printer.form.usage')}
              name="usage"
              options={usageOptions}
              required
            />
          </div>
        </SectionCard>
        <div className="mt-8 flex justify-center gap-3">
          <FormSubmitButton pending={false} />
          <FormCancelButton onClick={onCancel} />
        </div>
      </form>
    </>
  );
}

/** frame 의 여러 줄 `조치사항`. 라벨·오류·설명 연결은 공용 `FormField` 가, 컨트롤만 여기서 그린다. */
function PrinterMeasuresField({
  form,
  label,
}: {
  readonly form: FieldForm<PrinterFormInput>;
  readonly label: string;
}) {
  return (
    <FormField form={form} name="measures" label={label}>
      {(field, control) => (
        <textarea
          {...control}
          className="min-h-24 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-300 aria-invalid:border-red-600"
          name={field.name}
          rows={4}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
        />
      )}
    </FormField>
  );
}
