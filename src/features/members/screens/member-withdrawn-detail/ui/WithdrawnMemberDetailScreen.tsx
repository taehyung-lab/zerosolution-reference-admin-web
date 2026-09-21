/**
 * 4.4.1 탈퇴회원 조회: `회원정보`(탈퇴일·탈퇴사유 포함) · `활동정보`(탭·검색·선택삭제) · `업데이트 내역`.
 * 탈퇴한 회원에는 수정·탈퇴·재인증 액션이 없다. 헤더는 상태 경계 밖에 두어 조회 실패에도 제목이 남는다.
 */
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { deleteMemberActivityMutation } from '@/features/members/api/mutations';
import { useWithdrawnDetail } from '@/features/members/api/useWithdrawnDetail';
import { formatMemberInstant } from '@/features/members/lib/format-member-instant';
import { MemberActivitySection } from '@/features/members/shared/activity/ui/MemberActivitySection';
import type { WithdrawnMemberRow } from '@/features/members/model/member-records';
import { useLocale } from '@/shared/i18n/locale-context';
import { maskEmail } from '@/shared/lib/mask-contact';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { UpdateHistory } from '@/shared/ui/detail/UpdateHistory';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';

export function WithdrawnMemberDetailScreen({ memberId }: { readonly memberId: string }) {
  const { t } = useTranslation('members');
  const detail = useWithdrawnDetail(memberId);

  return (
    <section>
      <PageHeader
        title={t('screens.withdrawnDetail')}
        breadcrumbs={[t('path.members'), t('screens.withdrawn'), t('path.detail')]}
      />
      <DetailStateBoundary query={detail}>{(member) => <WithdrawnMemberDetailContent key={member.id} member={member} />}</DetailStateBoundary>
    </section>
  );
}

function WithdrawnMemberDetailContent({ member }: { readonly member: WithdrawnMemberRow }) {
  const { t } = useTranslation('members');
  const { locale } = useLocale();
  const deleteActivity = useMutation(deleteMemberActivityMutation(locale));

  return (
    <div className="space-y-5">
      <SectionCard title={t('detail.section')}>
        <dl>
          <DetailField label={t('fields.accountStatus')}>{t(`accountStatus.${member.accountStatus}`)}</DetailField>
          <DetailField label={t('fields.email')}>{maskEmail(member.email)}</DetailField>
          <DetailField label={t('fields.joinedAt')}>{formatMemberInstant(member.joinedAt)}</DetailField>
          <DetailField label={t('fields.signupMethod')}>{t(`signup.${member.signupMethod}`)}</DetailField>
          <DetailField label={t('fields.withdrawalDate')}>{formatMemberInstant(member.withdrawnAt)}</DetailField>
          <DetailField label={t('fields.reason')}>{member.reason}</DetailField>
        </dl>
      </SectionCard>
      <SectionCard title={t('activity.title')}>
        <MemberActivitySection
          memberId={member.id}
          onDelete={(input) => deleteActivity.mutateAsync({ memberId: member.id, ...input })}
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
