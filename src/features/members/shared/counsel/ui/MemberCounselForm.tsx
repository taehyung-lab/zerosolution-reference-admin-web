import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  memberCounselTypes,
  type MemberCounselInput,
  type MemberCounselValues,
} from '@/features/members/model/member-counsel';
import { formatDate } from '@/shared/lib/datetime';
import { FormField } from '@/shared/ui/form/FormField';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { Button } from '@/shared/ui/primitives/Button';
import { memberCounselSchema, toCounselInput } from '../model/member-counsel-schema';

/**
 * 상담 한 건의 입력·날짜 검증·dirty 상태. 상세 절의 신규 등록과 기록 편집, 팝업이 함께 쓴다.
 * 저장 확인 팝업이 없는 inline 폼이라 `useSaveForm` 이 아니라 `useForm` 이다. 저장 뒤 초안은 그대로 남는다.
 */
export function MemberCounselForm({
  initialValues,
  label,
  onSave,
  onCancel,
  onDirtyChange,
}: {
  readonly initialValues: MemberCounselValues;
  readonly label: string;
  readonly onSave: (values: MemberCounselInput) => void | Promise<unknown>;
  readonly onCancel?: () => void;
  readonly onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useTranslation('members');
  const { t: shared } = useTranslation('shared');
  const element = useRef<HTMLFormElement>(null);
  const today = formatDate(new Date().toISOString());
  const requiredMessage = shared('formError.required');
  const dateMessage = t('counsel.invalidDate');
  const form = useForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: memberCounselSchema(today, requiredMessage, dateMessage) },
    onSubmit: ({ value }) => onSave(toCounselInput(value, today, requiredMessage, dateMessage)),
    onSubmitInvalid: () => element.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
  });
  const dirty = useSelector(form.store, (state) => state.isDirty && !state.isDefaultValue);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(
    () => () => {
      onDirtyChange(false);
    },
    [onDirtyChange],
  );

  return (
    <form
      ref={element}
      aria-label={label}
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormTextField
          form={form}
          name="receivedAt"
          label={t('counsel.receivedAt')}
          type="datetime-local"
          step={60}
          max={`${today}T23:59`}
          required
        />
        <FormTextField form={form} name="operatorName" label={t('counsel.operatorName')} required />
        <FormSelectField
          form={form}
          name="inquiryType"
          label={t('counsel.inquiryType')}
          placeholder={t('counsel.chooseType')}
          required
          options={memberCounselTypes.map((value) => ({ value, label: t(`counsel.types.${value}`) }))}
        />
        <FormTextField
          form={form}
          name="answeredAt"
          label={t('counsel.answeredAt')}
          type="datetime-local"
          step={60}
          max={`${today}T23:59`}
          required
        />
      </div>
      <FormField form={form} name="content" label={t('counsel.content')} required>
        {(field, control) => (
          <textarea
            {...control}
            name="content"
            className="min-h-28 w-full rounded border p-2"
            value={typeof field.state.value === 'string' ? field.state.value : ''}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </FormField>
      <div className="flex gap-2">
        <Button type="submit">{shared('formAction.save')}</Button>
        {onCancel !== undefined ? (
          <Button type="button" onClick={onCancel}>
            {shared('formAction.cancel')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
