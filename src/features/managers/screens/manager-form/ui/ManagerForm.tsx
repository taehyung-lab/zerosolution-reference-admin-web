/**
 * 운영자 등록·수정 폼 — Figma 11.1.3 등록 / 11.1.4 수정 frame 의 `운영자정보` 섹션을 화면 순서대로 조립한다.
 * 두 frame 의 공통 항목·필수·선택지가 같아 등록·수정이 이 조립을 공유하고, 등록만 `identity` slot 에
 * 아이디·비밀번호 입력을, 수정은 읽기 전용 아이디를 넣는다. 권한 선택지는 선택한 유형에 종속되므로
 * 유형이 바뀌면 권한을 비운다(11-settings.md 11.1).
 */
import { useSelector, type DeepValue } from '@tanstack/react-form';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useManagerPermissionOptions, useManagerTypeOptions } from '@/features/managers/api/useManagerOptions';
import { FormCancelButton } from '@/shared/ui/form/FormCancelButton';
import type { FieldForm } from '@/shared/ui/form/FormField';
import { FormSaveFailureMessage } from '@/shared/ui/form/FormSaveDialogs';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormSubmitButton } from '@/shared/ui/form/FormSubmitButton';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import type { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import type { ManagerCreateInput, ManagerEditInput } from '../model/manager-form-schema';

export type ManagerSaveForm<TInput extends ManagerEditInput, TOutput> = ReturnType<
  typeof useSaveForm<TInput, TOutput, 'info'>
>;

export function ManagerForm<TInput extends ManagerEditInput, TOutput>({
  save,
  identity,
  onCancel,
}: {
  readonly save: ManagerSaveForm<TInput, TOutput>;
  readonly identity: ReactNode;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('managers');
  const { form } = save;
  const type = useSelector(form.store, (state) => state.values.type);
  const types = useManagerTypeOptions();
  const permissions = useManagerPermissionOptions({ type, enabled: type !== '' });
  const placeholder = t('form.selectPlaceholder');

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
        <SectionCard title={t('form.section')} {...save.sections.sectionProps('info')}>
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            <FormSelectField
              form={form}
              label={t('form.type')}
              name="type"
              options={types.items}
              state={types.state}
              onRetry={types.retry}
              onValueChange={() =>
                form.setFieldValue('permissionId', '' as DeepValue<TInput, 'permissionId'>)
              }
              placeholder={placeholder}
              required
            />
            <FormSelectField
              form={form}
              disabled={type === ''}
              label={t('form.permission')}
              name="permissionId"
              options={permissions.items}
              state={permissions.state}
              onRetry={permissions.retry}
              placeholder={placeholder}
              required
            />
            {identity}
            <FormTextField form={form} label={t('form.name')} name="name" placeholder={t('form.namePlaceholder')} required />
            <FormTextField form={form} label={t('form.phone')} name="phone" placeholder={t('form.phonePlaceholder')} required />
            <FormTextField form={form} label={t('form.email')} name="email" placeholder={t('form.emailPlaceholder')} required />
            <FormTextField
              form={form}
              label={t('form.organization')}
              name="organization"
              placeholder={t('form.organizationPlaceholder')}
            />
          </div>
        </SectionCard>
        <div className="mt-8 flex justify-center gap-3">
          <FormSubmitButton pending={save.submit.isPending} />
          <FormCancelButton disabled={save.submit.isPending} onClick={() => save.guard.leave(onCancel)} />
        </div>
      </form>
    </>
  );
}

/** 등록에만 있는 아이디·비밀번호·비밀번호 확인. 수정 화면은 아이디를 읽기 전용으로 보여 준다. */
export function ManagerCreateIdentityFields({ form }: { readonly form: FieldForm<ManagerCreateInput> }) {
  const { t } = useTranslation('managers');
  return (
    <>
      <FormTextField form={form} autoComplete="off" label={t('form.id')} name="id" placeholder={t('form.idPlaceholder')} required />
      <div className="md:col-span-2 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-5">
        <FormTextField
          form={form}
          autoComplete="new-password"
          label={t('form.password')}
          name="password"
          placeholder={t('form.passwordPlaceholder')}
          required
          type="password"
        />
        <FormTextField form={form} autoComplete="new-password" label={t('form.passwordConfirm')} name="passwordConfirm" required type="password" />
      </div>
    </>
  );
}
