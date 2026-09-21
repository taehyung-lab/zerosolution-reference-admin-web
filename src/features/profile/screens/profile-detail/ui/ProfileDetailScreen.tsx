import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { profileActionMutation } from '@/features/profile/api/mutations';
import { useProfileDetail } from '@/features/profile/api/useProfileDetail';
import type { ProfileDetail } from '@/features/profile/model/profile';
import { useLocale } from '@/shared/i18n/locale-context';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { AlertDialog } from '@/shared/ui/dialog/AlertDialog';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Button } from '@/shared/ui/primitives/Button';
import { ProfileActionForm, type ProfileInputAction } from './ProfileActionForm';

/**
 * 13.1 내정보 조회. 로그인한 운영자가 자기 계정을 여는 화면이라 ID param 이 없다 — 대상은 세션이
 * 정한다. `운영자정보` 섹션이 항목을 읽기 전용으로 보여 주고(원문 frame 에 마스킹도 재인증 버튼도
 * 없다), 비밀번호는 값 대신 `비밀번호 변경` 버튼이 있다. 하단은 `수정`(수정 화면으로 이동)과
 * `탈퇴`(비밀번호를 받는 alert)다. 두 액션 모두 입력이 필요하므로 `ProfileActionForm` 을 지나
 * mutation 에 닿고, 완료 alert 문구와 그 다음 이동은 이 화면이 소유한다.
 * 헤더는 상태 경계 밖에 두어 조회 실패에도 제목이 남는다.
 */
export function ProfileDetailScreen({
  onEdit,
  onWithdrawn,
}: {
  readonly onEdit: () => void;
  readonly onWithdrawn: () => void;
}) {
  const { t } = useTranslation('profile');
  const detail = useProfileDetail();

  return (
    <section>
      <PageHeader title={t('detailTitle')} breadcrumbs={[t('path.profile'), t('path.detail')]} />
      <DetailStateBoundary query={detail}>
        {(profile) => (
          <ProfileDetailContent profile={profile} onEdit={onEdit} onWithdrawn={onWithdrawn} />
        )}
      </DetailStateBoundary>
    </section>
  );
}

function ProfileDetailContent({
  profile,
  onEdit,
  onWithdrawn,
}: {
  readonly profile: ProfileDetail;
  readonly onEdit: () => void;
  readonly onWithdrawn: () => void;
}) {
  const { t } = useTranslation('profile');
  const { t: shared } = useTranslation('shared');
  const { locale } = useLocale();
  const action = useMutation(profileActionMutation(locale));
  const [inputAction, setInputAction] = useState<ProfileInputAction>();
  /** 원문의 완료 alert 는 종류마다 문구와 다음 전이가 다르다 — 변경은 현상태 유지, 탈퇴는 로그인 화면. */
  const [completed, setCompleted] = useState<ProfileInputAction>();
  const empty = t('detail.emptyValue');
  const text = (value: string) => (value === '' ? empty : value);

  return (
    <div className="space-y-5">
      <SectionCard title={t('section')}>
        {/* frame `13.1` 의 2열 짝: 아이디|비밀번호 · 이름|— · 휴대폰번호|이메일 · 소속|— · 가입경로|계정 상태 */}
        <dl className="grid md:grid-cols-2 md:gap-x-8">
          <DetailField label={t('fields.id')}>{profile.id}</DetailField>
          <DetailField label={t('fields.password')}>
            <Button onClick={() => setInputAction('changePassword')}>{t('actions.changePassword')}</Button>
          </DetailField>
          <DetailField label={t('fields.name')}>{text(profile.name)}</DetailField>
          <div aria-hidden="true" className="hidden md:block" />
          <DetailField label={t('fields.phone')}>{text(profile.phone)}</DetailField>
          <DetailField label={t('fields.email')}>{text(profile.email)}</DetailField>
          <DetailField label={t('fields.organization')}>{text(profile.organization)}</DetailField>
          <div aria-hidden="true" className="hidden md:block" />
          <DetailField label={t('fields.registrationRoute')}>{text(profile.registrationRoute)}</DetailField>
          <DetailField label={t('fields.accountStatus')}>{text(profile.accountStatus)}</DetailField>
        </dl>
      </SectionCard>
      <div className="relative flex justify-center">
        <Button onClick={onEdit}>{t('actions.edit')}</Button>
        <button
          className="absolute right-0 text-sm underline"
          type="button"
          onClick={() => setInputAction('withdraw')}
        >
          {t('actions.withdraw')}
        </button>
      </div>
      {inputAction ? (
        <ProfileActionForm
          key={inputAction}
          action={inputAction}
          onClose={() => setInputAction(undefined)}
          onCompleted={() => {
            setCompleted(inputAction);
            setInputAction(undefined);
          }}
          run={(request) => action.mutateAsync(request)}
        />
      ) : null}
      <AlertDialog
        open={completed !== undefined}
        onOpenChange={(open) => {
          if (open) return;
          const acknowledged = completed;
          setCompleted(undefined);
          /** 원문: 탈퇴 완료의 `확인` 은 로그인 화면으로 간다. 변경 완료는 현상태를 유지한다. */
          if (acknowledged === 'withdraw') onWithdrawn();
        }}
        title={shared('alert.title')}
        description={completed ? t(`actions.${completed}Completed`) : undefined}
        acknowledgeLabel={shared('formSave.acknowledge')}
      />
    </div>
  );
}
