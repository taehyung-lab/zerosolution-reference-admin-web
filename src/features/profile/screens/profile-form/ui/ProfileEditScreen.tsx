import { useMutation } from '@tanstack/react-query';
import { useSelector } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { updateProfileMutation } from '@/features/profile/api/mutations';
import { useProfileDetail } from '@/features/profile/api/useProfileDetail';
import type { ProfileDetail } from '@/features/profile/model/profile';
import { useLocale } from '@/shared/i18n/locale-context';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { FormCancelButton } from '@/shared/ui/form/FormCancelButton';
import { FormCheckboxField } from '@/shared/ui/form/FormCheckboxField';
import { FormSaveFailureMessage } from '@/shared/ui/form/FormSaveDialogs';
import { FormSubmitButton } from '@/shared/ui/form/FormSubmitButton';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { toProfileEditDefaults } from '../model/profile-form-defaults';
import { toProfileSettings } from '../model/profile-form-request';
import {
  profileEditBlurMessages,
  profileEditFieldOrder,
  profileEditSchema,
} from '../model/profile-form-schema';

/**
 * 13.2 내정보 수정. 등록이 없으므로 공유 조립 파일 없이 이 화면 하나가 폼을 그린다.
 * 조회 실패에도 제목이 남도록 헤더를 상태 경계 밖에 두고, 폼은 조회가 성공한 뒤에만 mount 해
 * 서버 재조회가 입력 초안을 덮어쓰지 않게 한다. 진입 실패는 route loader 가 이미 처리했다.
 */
export function ProfileEditScreen({
  onSaved,
  onCancel,
}: {
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('profile');
  const detail = useProfileDetail();

  return (
    <section>
      <PageHeader breadcrumbs={[t('path.profile'), t('path.edit')]} title={t('editTitle')} />
      <DetailStateBoundary query={detail}>
        {(profile) => (
          <ProfileEditForm key={profile.id} profile={profile} onSaved={onSaved} onCancel={onCancel} />
        )}
      </DetailStateBoundary>
    </section>
  );
}

function ProfileEditForm({
  profile,
  onSaved,
  onCancel,
}: {
  readonly profile: ProfileDetail;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('profile');
  const { locale } = useLocale();
  const update = useMutation(updateProfileMutation(locale));
  const save = useSaveForm({
    schema: profileEditSchema,
    defaultValues: toProfileEditDefaults(profile),
    sections: { info: profileEditFieldOrder },
    blurValidator: profileEditBlurMessages,
    save: {
      run: (values) => update.mutateAsync({ settings: toProfileSettings(values) }),
      isPending: update.isPending,
    },
    mapError: (error) => classifyFormError(error, profileEditFieldOrder),
    onDone: onSaved,
  });
  const { form } = save;
  /** 원문: `수정 체크박스 활성화시, 입력필드 활성화`. 끈 상태가 default 다. */
  const passwordEdit = useSelector(form.store, (state) => state.values.passwordEdit);

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
        <SectionCard title={t('section')} {...save.sections.sectionProps('info')}>
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            {/* frame `13.2` 의 2열 배치: 아이디·이름 옆 칸은 비어 있다. */}
            <FormTextField readOnly label={t('fields.id')} value={profile.id} />
            <div aria-hidden="true" className="hidden md:block" />
            <div className="space-y-2">
              <FormCheckboxField form={form} label={t('form.passwordEdit')} name="passwordEdit" />
              <FormTextField
                autoComplete="new-password"
                disabled={!passwordEdit}
                form={form}
                label={t('form.password')}
                name="password"
                placeholder={t('form.passwordPlaceholder')}
                required
                type="password"
              />
            </div>
            <FormTextField
              autoComplete="new-password"
              disabled={!passwordEdit}
              form={form}
              label={t('form.passwordConfirm')}
              name="passwordConfirm"
              placeholder={t('form.passwordConfirmPlaceholder')}
              required
              type="password"
            />
            <FormTextField form={form} label={t('fields.name')} name="name" required />
            <div aria-hidden="true" className="hidden md:block" />
            <FormTextField form={form} label={t('fields.phone')} name="phone" required />
            <FormTextField form={form} label={t('fields.email')} name="email" required />
            <FormTextField form={form} label={t('fields.organization')} name="organization" />
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
