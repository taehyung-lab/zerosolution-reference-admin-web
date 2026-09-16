/**
 * 4.7.1 소명신청 조회: `회원정보`(회원정보 조회 링크) · `소명신청 정보` · `처리 결과`(통보 전에는 입력 폼, 통보 뒤에는 저장된 값) ·
 * `업데이트 내역`. 통보는 저장된 처리 결과만 보낸다. 헤더는 상태 경계 밖에 두어 조회 실패에도 제목이 남는다.
 * SMS·이메일 작성과 회원 조회 경로는 route 가 소유한다.
 */
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { notifyAppealMutation, saveAppealProcessingMutation } from '@/features/members/api/mutations';
import { useAppealDetail } from '@/features/members/api/useAppealDetail';
import { formatMemberInstant } from '@/features/members/lib/format-member-instant';
import type { MemberMessageChannel } from '@/features/members/model/member';
import type { AppealRecord } from '@/features/members/model/member-records';
import { useLocale } from '@/shared/i18n/locale-context';
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { UpdateHistory } from '@/shared/ui/detail/UpdateHistory';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Button } from '@/shared/ui/primitives/Button';
import { AppealNotifyAction } from './AppealNotifyAction';
import { AppealProcessingForm } from './AppealProcessingForm';

export function AppealDetailScreen({
  appealId,
  memberHref,
  onMessage,
}: {
  readonly appealId: string;
  readonly memberHref: (memberId: string) => string;
  readonly onMessage: (channel: MemberMessageChannel) => void;
}) {
  const { t } = useTranslation('members');
  const detail = useAppealDetail(appealId);

  return (
    <section>
      <PageHeader
        title={t('screens.appealDetail')}
        breadcrumbs={[t('path.members'), t('screens.appeals'), t('path.detail')]}
        actions={
          detail.data ? (
            <>
              <Button onClick={() => onMessage('sms')}>{t('actions.sms')}</Button>
              <Button onClick={() => onMessage('email')}>{t('actions.email')}</Button>
            </>
          ) : null
        }
      />
      <DetailStateBoundary query={detail}>
        {(record) => <AppealDetailContent key={record.id} record={record} memberHref={memberHref(record.memberId)} />}
      </DetailStateBoundary>
    </section>
  );
}

function AppealDetailContent({ record, memberHref }: { readonly record: AppealRecord; readonly memberHref: string }) {
  const { t } = useTranslation('members');
  const { locale } = useLocale();
  const save = useMutation(saveAppealProcessingMutation(locale));
  const notify = useMutation(notifyAppealMutation(locale));

  return (
    <div className="space-y-5">
      <SectionCard title={t('appeal.member')}>
        <dl>
          <DetailField label={t('fields.accountStatus')}>{t(`accountStatus.${record.accountStatus}`)}</DetailField>
          <DetailField label={t('fields.restrictions')}>
            {record.restrictions.map((value) => t(`restriction.${value}`)).join(', ')}
          </DetailField>
          <DetailField label={t('fields.birthDate')}>{record.birthDate}</DetailField>
          <DetailField label={t('fields.joinedAt')}>{formatMemberInstant(record.joinedAt)}</DetailField>
          <DetailField label={t('fields.signupMethod')}>{t(`signup.${record.signupMethod}`)}</DetailField>
          <DetailField label={t('fields.email')}>{maskEmail(record.email)}</DetailField>
          <DetailField label={t('fields.name')}>{record.name}</DetailField>
          <DetailField label={t('fields.phone')}>{maskPhone(record.phone)}</DetailField>
        </dl>
        <a href={memberHref} target="_blank" rel="noopener noreferrer">
          {t('appeal.memberLink')}
        </a>
      </SectionCard>
      <SectionCard title={t('appeal.application')}>
        <dl>
          <DetailField label={t('fields.appliedAt')}>{formatMemberInstant(record.appliedAt)}</DetailField>
        </dl>
        <p className="whitespace-pre-wrap">{record.application}</p>
        {record.attachments.map((file) => (
          <a key={file.href} href={file.href} download>
            {file.name}
          </a>
        ))}
      </SectionCard>
      <SectionCard title={t('appeal.processing')} keepMounted>
        {record.notified ? (
          <AppealProcessingDetails record={record} />
        ) : (
          <AppealProcessingForm
            processing={record.processing}
            onSave={(processing) => save.mutateAsync({ appealId: record.id, processing })}
          />
        )}
        <AppealNotifyAction
          record={record}
          onNotify={() => notify.mutateAsync({ appealId: record.id, processing: record.processing })}
        />
      </SectionCard>
      <SectionCard title={t('detail.history')}>
        <UpdateHistory
          entries={[]}
          labels={{ date: t('detail.updatedAt'), change: t('detail.change'), actor: t('detail.actor') }}
          emptyText={t('detail.historyEmpty')}
        />
      </SectionCard>
    </div>
  );
}

/** 통보가 끝난 소명은 처리 결과를 읽기 전용으로 보인다. */
function AppealProcessingDetails({ record }: { readonly record: AppealRecord }) {
  const { t } = useTranslation('members');
  const { processing } = record;
  return (
    <>
      <dl>
        <DetailField label={t('fields.status')}>{t(`states.${processing.status}`)}</DetailField>
        <DetailField label={t('fields.result')}>{t(`states.${processing.result}`)}</DetailField>
        {processing.result === 'rejected' ? (
          <>
            <DetailField label={t('appeal.reason')}>
              {processing.reason === '' ? t('detail.emptyValue') : t(`appeal.${processing.reason}`)}
            </DetailField>
            {processing.reason === 'other' ? <DetailField label={t('appeal.direct')}>{processing.direct}</DetailField> : null}
          </>
        ) : null}
        <DetailField label={t('appeal.opinion')}>{processing.opinion}</DetailField>
      </dl>
      <p>{t('appeal.notified')}</p>
    </>
  );
}
