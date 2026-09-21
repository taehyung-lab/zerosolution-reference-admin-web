/**
 * 회원 등록·수정 폼 — Figma 4.2.2 등록 / 4.2.3 수정 frame 의 `회원정보` 섹션. 두 frame 의 공통 항목(이름·생년월일·
 * 휴대폰번호)을 이 조립이 소유하고, 한쪽에만 있는 필드는 `children` 자리에 온다 — 등록은 이메일·비밀번호,
 * 수정은 계정 상태·활동제한과 읽기 전용 이메일. 활동제한은 불량회원일 때만 보이되 초안은 숨긴 채 유지한다(`Activity`).
 */
import { useSelector } from '@tanstack/react-form';
import { Activity, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { memberAccountStatuses, memberRestrictions } from '@/features/members/model/member';
import { formatDate } from '@/shared/lib/datetime';
import { FormCancelButton } from '@/shared/ui/form/FormCancelButton';
import { FormDateField } from '@/shared/ui/form/FormDateField';
import type { FieldForm } from '@/shared/ui/form/FormField';
import { FormPermissionTreeField } from '@/shared/ui/form/FormPermissionTreeField';
import { FormSaveFailureMessage } from '@/shared/ui/form/FormSaveDialogs';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormSubmitButton } from '@/shared/ui/form/FormSubmitButton';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import type { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import type { MemberCreateInput, MemberEditInput, MemberEditValues, MemberProfileInput } from '../model/member-form-schema';

export type MemberSaveForm<TInput extends MemberProfileInput, TOutput> = ReturnType<
  typeof useSaveForm<TInput, TOutput, 'info'>
>;

export function MemberForm<TInput extends MemberProfileInput, TOutput>({
  save,
  children,
  onCancel,
}: {
  readonly save: MemberSaveForm<TInput, TOutput>;
  readonly children: ReactNode;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('members');
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
        <SectionCard title={t('form.section')} {...save.sections.sectionProps('info')}>
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            {children}
            <FormTextField form={form} label={t('form.name')} name="name" required />
            <FormDateField
              form={form}
              label={t('form.birthDate')}
              name="birthDate"
              required
              max={formatDate(new Date().toISOString())}
            />
            <FormTextField form={form} label={t('form.phone')} name="phone" required type="tel" autoComplete="tel" />
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

/** 등록에만 있는 이메일·비밀번호. */
export function MemberCreateOnlyFields({ form }: { readonly form: FieldForm<MemberCreateInput> }) {
  const { t } = useTranslation('members');
  return (
    <>
      <FormTextField form={form} label={t('form.email')} name="email" required autoComplete="email" />
      <FormTextField
        form={form}
        label={t('form.password')}
        name="password"
        required
        type="password"
        autoComplete="new-password"
      />
    </>
  );
}

/** 수정에만 있는 계정 상태·활동제한과 읽기 전용 이메일. 활동제한은 불량회원일 때만 보인다. */
export function MemberEditOnlyFields({
  form,
  email,
}: {
  readonly form: MemberSaveForm<MemberEditInput, MemberEditValues>['form'];
  readonly email: string;
}) {
  const { t } = useTranslation('members');
  const accountStatus = useSelector(form.store, (state) => state.values.accountStatus);
  return (
    <>
      <FormSelectField
        form={form}
        label={t('form.accountStatus')}
        name="accountStatus"
        required
        options={memberAccountStatuses.map((value) => ({ value, label: t(`accountStatus.${value}`) }))}
      />
      <Activity mode={accountStatus === 'flagged' ? 'visible' : 'hidden'}>
        <FormPermissionTreeField
          form={form}
          label={t('form.restrictions')}
          name="restrictions"
          required
          nodes={memberRestrictions.map((value) => ({ value, label: t(`restriction.${value}`) }))}
        />
      </Activity>
      <FormTextField readOnly label={t('form.email')} value={email} />
    </>
  );
}
