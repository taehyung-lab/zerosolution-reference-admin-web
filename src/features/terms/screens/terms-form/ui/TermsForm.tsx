/**
 * 약관 등록·수정 폼 — Figma 11.2.3 등록 / 11.2.4 수정 frame 의 `기본정보` 섹션을 화면 순서대로
 * 조립한다(2026-09-22 aside 실측): 버전 * → 시행일 * → 게시 상태 * · 게시일 * → 본문 * → 저장·취소.
 * 규칙(필수·글자수·입력가능문자·기본값)은 스키마·기본값 파일이 소유한다.
 *
 * frame 이 그리지만 여기 없는 것과 그 이유는 `terms-form-schema.ts` 의 머리글과 TERMS-FORM fact 가
 * 이름으로 적는다(버전 입력의 `V` 접두 표기, 시행일·게시일의 시·분·초, 본문의 HTML 에디터).
 */
import { useTranslation } from 'react-i18next';
import { termsStatuses } from '@/features/terms/model/terms';
import { FormCancelButton } from '@/shared/ui/form/FormCancelButton';
import { FormDateField } from '@/shared/ui/form/FormDateField';
import { FormField } from '@/shared/ui/form/FormField';
import { FormSaveFailureMessage } from '@/shared/ui/form/FormSaveDialogs';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormSubmitButton } from '@/shared/ui/form/FormSubmitButton';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import type { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import type { TermsFormInput, TermsFormValues } from '../model/terms-form-schema';

export type TermsSaveForm = ReturnType<typeof useSaveForm<TermsFormInput, TermsFormValues, 'info'>>;

export function TermsForm({
  save,
  onCancel,
}: {
  readonly save: TermsSaveForm;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('terms');
  const { form } = save;

  return (
    <>
      {save.dialogs}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save.submit.run();
        }}
      >
        {save.stage.kind === 'failed' ? <FormSaveFailureMessage failure={save.stage.root} /> : null}
        <SectionCard title={t('terms.form.section')} {...save.sections.sectionProps('info')}>
          <div className="space-y-6">
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormTextField
                form={form}
                label={t('terms.columns.version')}
                name="version"
                required
              />
            </div>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormDateField
                form={form}
                label={t('terms.columns.effectiveAt')}
                name="effectiveAt"
                required
              />
            </div>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormSelectField
                form={form}
                label={t('terms.columns.status')}
                name="status"
                options={termsStatuses.map((value) => ({
                  value,
                  label: t(`terms.values.status.${value}`),
                }))}
                required
              />
              <FormDateField
                form={form}
                label={t('terms.columns.publishedAt')}
                name="publishedAt"
                required
              />
            </div>
            <div className="grid gap-x-8 gap-y-4">
              <FormField form={form} name="body" label={t('terms.columns.body')} required>
                {(field, control) => (
                  <textarea
                    {...control}
                    className="min-h-80 w-full rounded border border-neutral-300 p-3 text-sm"
                    name={field.name}
                    value={typeof field.state.value === 'string' ? field.state.value : ''}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                )}
              </FormField>
            </div>
          </div>
        </SectionCard>
        <div className="mt-6 flex justify-center gap-2">
          <FormSubmitButton pending={save.submit.isPending} />
          <FormCancelButton disabled={save.submit.isPending} onClick={() => save.guard.leave(onCancel)} />
        </div>
      </form>
    </>
  );
}
