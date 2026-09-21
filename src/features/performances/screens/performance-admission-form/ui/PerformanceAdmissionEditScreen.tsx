/**
 * 5.2.3 공연 수정(Notion 원문 「입장안내정보를 수정할 수 있다」 + 5.2.3 · 5.2.3.1 KeyScreen,
 * 2026-09-17 재관찰). 편집 대상은 `입장안내정보` 섹션 하나이고, 그 아래 `기본정보` 는 조회와 같은
 * 읽기 조립이다. 저장·취소는 frame 대로 편집 섹션 안에 있다.
 *
 * 조회 실패에도 제목이 남도록 헤더를 상태 경계 밖에 두고, 폼은 조회가 성공한 뒤에만 mount 해
 * 재조회가 입력 초안을 덮어쓰지 않게 한다. 진입 실패는 route loader 가 이미 처리했다.
 */
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { updatePerformanceAdmissionMutation } from '@/features/performances/api/mutations';
import { usePerformanceDetail } from '@/features/performances/api/usePerformanceDetail';
import { PerformanceBasicSection } from '@/features/performances/shared/basic-info/ui/PerformanceBasicSection';
import type { PerformanceDetail } from '@/features/performances/model/performance-detail';
import { useLocale } from '@/shared/i18n/locale-context';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { FormArrayField } from '@/shared/ui/form/FormArrayField';
import { FormCancelButton } from '@/shared/ui/form/FormCancelButton';
import { FormFileField } from '@/shared/ui/form/FormFileField';
import { FormMultiSelectField } from '@/shared/ui/form/FormMultiSelectField';
import { FormSaveFailureMessage } from '@/shared/ui/form/FormSaveDialogs';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormSubmitButton } from '@/shared/ui/form/FormSubmitButton';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Button } from '@/shared/ui/primitives/Button';
import { emptyGuideRow, toAdmissionEditDefaults } from '../model/admission-defaults';
import { toAdmissionSettings } from '../model/admission-request';
import {
  ADMISSION_AREA_MAX_LENGTH,
  admissionFormFieldOrder,
  admissionFormSchema,
  admissionInputModes,
  type AdmissionFormInput,
  type AdmissionFormValues,
} from '../model/admission-schema';

type AdmissionSaveForm = ReturnType<
  typeof useSaveForm<AdmissionFormInput, AdmissionFormValues, 'admission'>
>;

export function PerformanceAdmissionEditScreen({
  performanceId,
  onSaved,
  onCancel,
}: {
  readonly performanceId: string;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('performances');
  const detail = usePerformanceDetail(performanceId);

  return (
    <section>
      <PageHeader
        title={t('edit.title')}
        breadcrumbs={[t('detail.path'), t('title'), t('detail.view'), t('detail.edit')]}
      />
      <DetailStateBoundary query={detail}>
        {(performance) => (
          <AdmissionEditForm
            key={performance.id}
            performance={performance}
            onSaved={onSaved}
            onCancel={onCancel}
          />
        )}
      </DetailStateBoundary>
    </section>
  );
}

function AdmissionEditForm({
  performance,
  onSaved,
  onCancel,
}: {
  readonly performance: PerformanceDetail;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('performances');
  const { locale } = useLocale();
  const update = useMutation(updatePerformanceAdmissionMutation(locale));
  const [defaultValues] = useState(() => toAdmissionEditDefaults(performance));
  const save = useSaveForm({
    schema: admissionFormSchema,
    defaultValues,
    sections: { admission: admissionFormFieldOrder },
    save: {
      run: (values) =>
        update.mutateAsync({
          performanceId: performance.id,
          settings: toAdmissionSettings(values),
        }),
      isPending: update.isPending,
    },
    mapError: (error) => classifyFormError(error, admissionFormFieldOrder),
    onDone: onSaved,
  });
  const { form } = save;
  const gateOptions = performance.basic.gates.map((gate) => ({ value: gate.name, label: gate.name }));
  const gradeOptions = performance.basic.grades.map((grade) => ({
    value: grade.name,
    label: grade.name,
  }));

  /**
   * 입력 방식이 바뀌면 반대 방식의 입력은 비운다 — 전환 후 재전환의 복원은 원문이 요구하지 않는다
   * (PERF-EDIT-ADMISSION 미확인 3). 종속 값 비우기는 effect 가 아니라 이 필드의 변경에서 한다.
   */
  const clearOppositeValues = (mode: string) => {
    form.state.values.guides.forEach((_row, index) => {
      if (mode === 'zone') form.setFieldValue(`guides[${index}].grades`, []);
      else form.setFieldValue(`guides[${index}].area`, '');
    });
  };

  return (
    <div className="space-y-5">
      {save.dialogs}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save.submit.run();
        }}
      >
        {save.stage.kind === 'failed' ? <FormSaveFailureMessage failure={save.stage.root} /> : null}
        <SectionCard title={t('detail.admission')} {...save.sections.sectionProps('admission')}>
          <div className="max-w-2xl">
            <FormFileField
              form={form}
              name="drawing"
              label={t('detail.drawing')}
              selectLabel={t('edit.selectFile')}
              removeLabel={t('edit.removeFile')}
              required
            />
          </div>
          <h3 className="mt-6 text-sm font-semibold">{t('detail.guide')}</h3>
          <div className="mt-3 max-w-xs">
            <FormSelectField
              form={form}
              name="inputMode"
              label={t('detail.inputMode')}
              options={admissionInputModes.map((mode) => ({
                value: mode,
                label: t(`detail.modes.${mode}`),
              }))}
              onValueChange={clearOppositeValues}
            />
          </div>
          <GuideRows form={form} gateOptions={gateOptions} gradeOptions={gradeOptions} />
          <div className="mt-8 flex justify-center gap-3">
            <FormSubmitButton pending={save.submit.isPending} />
            <FormCancelButton
              disabled={save.submit.isPending}
              onClick={() => save.guard.leave(onCancel)}
            />
          </div>
        </SectionCard>
      </form>
      <PerformanceBasicSection basic={performance.basic} />
    </div>
  );
}

const rowButton = 'border border-neutral-300 bg-white text-neutral-900';

/**
 * 게이트 + (구역 | 등급) 반복 행. 원문의 `추가` 는 하단에 행을 더하고 `삭제` 는 그 행을 지운다.
 * 행 정체성은 배열 index 가 아니라 행의 `id` 이므로 삭제 뒤에도 값과 오류가 남은 행을 따라간다.
 * 게이트는 최소 1행이라 마지막 한 행은 삭제되지 않는다.
 */
function GuideRows({
  form,
  gateOptions,
  gradeOptions,
}: {
  readonly form: AdmissionSaveForm['form'];
  readonly gateOptions: readonly { value: string; label: string }[];
  readonly gradeOptions: readonly { value: string; label: string }[];
}) {
  const { t } = useTranslation('performances');
  return (
    <form.Subscribe selector={(state) => state.values.inputMode}>
      {(inputMode) => (
        <FormArrayField form={form} name="guides" minItems={1}>
          {(array) => (
            <>
              <div className="mt-4 space-y-3">
                {array.items.map((row, index) => (
                  <div key={row.id} className="flex flex-wrap items-start gap-3">
                    <div className="w-60 [&_label]:sr-only">
                      {index === 0 ? (
                        <p className="mb-2 text-sm font-medium text-neutral-800">
                          {t('detail.gate')}
                          <span aria-hidden="true">*</span>
                        </p>
                      ) : null}
                      <FormSelectField
                        form={form}
                        name={`guides[${index}].gate`}
                        label={t('edit.gateFor', { order: index + 1 })}
                        options={gateOptions}
                        placeholder={t('edit.select')}
                        required
                      />
                    </div>
                    <div className="w-60 [&_label]:sr-only">
                      {index === 0 ? (
                        <p className="mb-2 text-sm font-medium text-neutral-800">
                          {t(`detail.modes.${inputMode}`)}
                          <span aria-hidden="true">*</span>
                        </p>
                      ) : null}
                      {inputMode === 'zone' ? (
                        <FormTextField
                          form={form}
                          name={`guides[${index}].area`}
                          label={t('edit.areaFor', { order: index + 1 })}
                          maxLength={ADMISSION_AREA_MAX_LENGTH}
                          required
                        />
                      ) : (
                        <FormMultiSelectField
                          form={form}
                          name={`guides[${index}].grades`}
                          label={t('edit.gradeFor', { order: index + 1 })}
                          options={gradeOptions}
                          getRemoveLabel={(option) => t('edit.removeGrade', { value: option.label })}
                          required
                        />
                      )}
                    </div>
                    <div className={`flex gap-2${index === 0 ? ' mt-7' : ''}`}>
                      {array.canRemove ? (
                        <Button
                          aria-label={t('edit.removeRow', { order: index + 1 })}
                          className={rowButton}
                          onClick={() => array.remove(index)}
                        >
                          {t('edit.remove')}
                        </Button>
                      ) : null}
                      {index === array.items.length - 1 ? (
                        <Button className={rowButton} onClick={() => array.append(emptyGuideRow())}>
                          {t('edit.add')}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-neutral-600">{t(`edit.guideHint.${inputMode}`)}</p>
            </>
          )}
        </FormArrayField>
      )}
    </form.Subscribe>
  );
}
