/**
 * 4.2 회원 조회. `회원정보` 섹션이 항목을 읽기 전용으로 보여 주고(이메일·휴대폰은 재인증 전까지 마스킹), 비밀번호 변경·
 * 개인정보 전체보기·수정·회원 탈퇴가 따른다. 그 아래 `활동정보`(탭·검색·선택삭제) · `회원상담`(신규·수정·삭제) ·
 * `업데이트 내역`. 입력이 필요한 액션은 `MemberActionForm` 을 지나 mutation 에 닿는다. 헤더는 상태 경계 밖에 두어
 * 조회 실패에도 제목이 남는다. SMS·이메일 작성은 route 가 소유하고 이 화면은 채널만 알린다.
 */
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createMemberCounselMutation,
  deleteMemberActivityMutation,
  deleteMemberCounselMutation,
  memberActionMutation,
  updateMemberCounselMutation,
} from '@/features/members/api/mutations';
import { useMemberCounselRecords } from '@/features/members/api/useMemberCounselRecords';
import { useMemberDetail } from '@/features/members/api/useMemberDetail';
import { formatMemberInstant } from '@/features/members/lib/format-member-instant';
import { MemberActivitySection } from '@/features/members/mechanics/activity/ui/MemberActivitySection';
import { MemberCounselRecords } from '@/features/members/mechanics/counsel/ui/MemberCounselRecords';
import type { MemberMessageChannel, MemberProfile } from '@/features/members/model/member';
import { useLocale } from '@/shared/i18n/locale-context';
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { UpdateHistory } from '@/shared/ui/detail/UpdateHistory';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Button } from '@/shared/ui/primitives/Button';
import { MemberActionForm, type MemberInputAction } from './MemberActionForm';

export function MemberDetailScreen({
  memberId,
  onEdit,
  onMessage,
}: {
  readonly memberId: string;
  readonly onEdit: (memberId: string) => void;
  readonly onMessage: (channel: MemberMessageChannel) => void;
}) {
  const { t } = useTranslation('members');
  const detail = useMemberDetail(memberId);

  return (
    <section>
      <PageHeader
        title={t('detail.title')}
        breadcrumbs={[t('path.members'), t('path.active'), t('path.detail')]}
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
        {(member) => <MemberDetailContent key={member.id} member={member} onEdit={onEdit} />}
      </DetailStateBoundary>
    </section>
  );
}

function MemberDetailContent({
  member,
  onEdit,
}: {
  readonly member: MemberProfile;
  readonly onEdit: (memberId: string) => void;
}) {
  const { t } = useTranslation('members');
  const { locale } = useLocale();
  const action = useMutation(memberActionMutation(locale));
  const deleteActivity = useMutation(deleteMemberActivityMutation(locale));
  const createCounsel = useMutation(createMemberCounselMutation(locale));
  const updateCounsel = useMutation(updateMemberCounselMutation(locale));
  const deleteCounsel = useMutation(deleteMemberCounselMutation(locale));
  const records = useMemberCounselRecords(member.id);
  const [inputAction, setInputAction] = useState<MemberInputAction>();

  return (
    <div className="space-y-5">
      <SectionCard title={t('detail.section')} keepMounted>
        <dl>
          <DetailField label={t('fields.accountStatus')}>{t(`accountStatus.${member.accountStatus}`)}</DetailField>
          {member.accountStatus === 'flagged' ? (
            <DetailField label={t('fields.restrictions')}>
              {member.restrictions.map((value) => t(`restriction.${value}`)).join(', ')}
            </DetailField>
          ) : null}
          <DetailField label={t('fields.email')}>{maskEmail(member.email)}</DetailField>
          <DetailField label={t('fields.password')}>
            <Button onClick={() => setInputAction('password')}>{t('detailAction.passwordTitle')}</Button>
          </DetailField>
          <DetailField label={t('fields.name')}>{member.name}</DetailField>
          <DetailField label={t('fields.birthDate')}>{member.birthDate}</DetailField>
          <DetailField label={t('fields.phone')}>{maskPhone(member.phone)}</DetailField>
          <DetailField label={t('fields.joinedAt')}>{formatMemberInstant(member.joinedAt)}</DetailField>
          <DetailField label={t('fields.signupMethod')}>{t(`signup.${member.signupMethod}`)}</DetailField>
        </dl>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => setInputAction('reveal')}>{t('detailAction.revealTitle')}</Button>
          <Button onClick={() => onEdit(member.id)}>{t('actions.edit')}</Button>
          <Button onClick={() => setInputAction('verifyWithdrawal')}>{t('detailAction.withdrawTitle')}</Button>
        </div>
      </SectionCard>
      <SectionCard title={t('activity.title')} keepMounted>
        <MemberActivitySection
          memberId={member.id}
          onDelete={(input) => deleteActivity.mutateAsync({ memberId: member.id, ...input })}
        />
      </SectionCard>
      <SectionCard title={t('counsel.title')} keepMounted>
        <MemberCounselRecords
          records={records}
          operatorName={t('counsel.defaultOperator')}
          onCreate={(input) => createCounsel.mutateAsync({ memberId: member.id, input })}
          onUpdate={(id, input) => updateCounsel.mutateAsync({ memberId: member.id, id, input })}
          onDelete={(id) => deleteCounsel.mutateAsync({ memberId: member.id, id })}
        />
      </SectionCard>
      <SectionCard title={t('detail.history')} keepMounted>
        <UpdateHistory
          entries={[]}
          labels={{ date: t('detail.updatedAt'), change: t('detail.change'), actor: t('detail.actor') }}
          emptyText={t('detail.historyEmpty')}
        />
      </SectionCard>
      {inputAction ? (
        <MemberActionForm
          key={inputAction}
          action={inputAction}
          memberId={member.id}
          onClose={() => setInputAction(undefined)}
          run={(request) => action.mutateAsync(request)}
        />
      ) : null}
    </div>
  );
}
