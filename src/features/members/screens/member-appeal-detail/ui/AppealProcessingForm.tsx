import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  appealReasons,
  appealResults,
  appealStatuses,
  type AppealProcessing,
} from '@/features/members/model/member-records';
import { FormField } from '@/shared/ui/form/FormField';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { useUnsavedChangesGuard } from '@/shared/ui/form/UnsavedChangesGuard';
import { Button } from '@/shared/ui/primitives/Button';

/** 결과를 고를 수 있는 처리상태. 대기·검토중에는 결과가 대기로 고정된다. */
const decidedStatuses: readonly AppealProcessing['status'][] = ['held', 'completed'];

/**
 * 소명 처리 결과의 입력·조건부 검증(거절이면 사유, 기타면 직접 입력). 저장 확인 팝업이 없는 inline 폼이라
 * `useSaveForm` 이 아니라 `useForm` 이다. 저장 뒤 초안은 그대로 남고, 통보의 기준은 저장된 값이다.
 */
export function AppealProcessingForm({
  processing,
  onSave,
}: {
  readonly processing: AppealProcessing;
  readonly onSave: (values: AppealProcessing) => Promise<unknown>;
}) {
  const { t } = useTranslation('members');
  const { t: shared } = useTranslation('shared');
  const required = shared('formError.required');
  const schema = z
    .object({
      status: z.enum(appealStatuses),
      result: z.enum(appealResults),
      reason: z.enum(['', ...appealReasons]),
      direct: z.string(),
      opinion: z.string(),
    })
    .superRefine((value, ctx) => {
      if (!decidedStatuses.includes(value.status) || value.result !== 'rejected') return;
      if (value.reason === '') ctx.addIssue({ code: 'custom', path: ['reason'], message: required });
      if (value.reason === 'other' && value.direct.trim() === '')
        ctx.addIssue({ code: 'custom', path: ['direct'], message: required });
    });
  const form = useForm({
    defaultValues: processing,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => {
      const parsed = schema.parse(value);
      const result = decidedStatuses.includes(parsed.status) ? parsed.result : 'waiting';
      return onSave({
        ...parsed,
        result,
        reason: result === 'rejected' ? parsed.reason : '',
        direct: result === 'rejected' && parsed.reason === 'other' ? parsed.direct : '',
      });
    },
  });
  const values = useSelector(form.store, (state) => state.values);
  const dirty = useSelector(form.store, (state) => state.isDirty && !state.isDefaultValue);
  const guard = useUnsavedChangesGuard({ when: dirty });
  const decided = decidedStatuses.includes(values.status);

  return (
    <>
      {guard.dialog}
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <FormSelectField
          form={form}
          name="status"
          label={t('fields.status')}
          options={appealStatuses.map((value) => ({ value, label: t(`states.${value}`) }))}
        />
        <FormSelectField
          form={form}
          name="result"
          label={t('fields.result')}
          disabled={!decided}
          options={appealResults.map((value) => ({ value, label: t(`states.${value}`) }))}
        />
        {decided && values.result === 'rejected' ? (
          <>
            <FormSelectField
              form={form}
              name="reason"
              label={t('appeal.reason')}
              required
              placeholder={t('appeal.choose')}
              options={appealReasons.map((value) => ({ value, label: t(`appeal.${value}`) }))}
            />
            {values.reason === 'other' ? <FormTextField form={form} name="direct" label={t('appeal.direct')} required /> : null}
          </>
        ) : null}
        <FormField form={form} name="opinion" label={t('appeal.opinion')}>
          {(field, control) => (
            <textarea
              {...control}
              className="min-h-28 w-full rounded border p-2"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          )}
        </FormField>
        <div className="flex gap-2">
          <Button type="submit">{shared('formAction.save')}</Button>
          <Button type="button" onClick={() => guard.close(() => form.reset())}>
            {shared('formAction.cancel')}
          </Button>
        </div>
      </form>
    </>
  );
}
