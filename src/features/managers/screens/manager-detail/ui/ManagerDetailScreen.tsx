/**
 * 11.1.2 운영자 조회. `운영자정보` 섹션이 항목을 읽기 전용으로 보여 주고(휴대폰·이메일은 재인증 전까지 마스킹),
 * 계정 상태별 액션(승인·거절·삭제·활성·비활성·잠금해제·비밀번호 변경·개인정보 전체보기·탈퇴)과 `업데이트 내역`,
 * 하단 `수정`(활성·비활성·잠금에서만)이 따른다. 확인만 받는 액션은 공용 확인창, 입력이 필요한 액션은
 * `ManagerActionForm` 을 지나 mutation 에 닿는다. 헤더는 상태 경계 밖에 두어 조회 실패에도 제목이 남는다.
 * SMS·이메일 작성은 route 가 소유하고 이 화면은 채널만 알린다(원문: 대기 상태에는 이메일 없음).
 */
import { useMutation } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { managerActionMutation } from '@/features/managers/api/mutations';
import { useManagerDetail } from '@/features/managers/api/useManagerDetail';
import type { ManagerAccountStatus, ManagerAction, ManagerDetail } from '@/features/managers/model/manager';
import { useLocale } from '@/shared/i18n/locale-context';
import { formatDate } from '@/shared/lib/datetime';
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { UpdateHistory } from '@/shared/ui/detail/UpdateHistory';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Badge } from '@/shared/ui/primitives/Badge';
import { Button } from '@/shared/ui/primitives/Button';
import { toManagerHistoryEntries } from '../model/manager-history';
import { ManagerActionForm, type ManagerInputAction } from './ManagerActionForm';

type ConfirmAction = Extract<ManagerAction['type'], 'approve' | 'delete' | 'activate' | 'deactivate'>;

const statusTone: Readonly<Record<ManagerAccountStatus, 'neutral' | 'success' | 'warning' | 'danger'>> = {
  awaiting: 'warning',
  rejected: 'danger',
  active: 'success',
  inactive: 'neutral',
  locked: 'danger',
};

export function ManagerDetailScreen({
  managerId,
  onEdit,
  onMessage,
}: {
  readonly managerId: string;
  readonly onEdit: (managerId: string) => void;
  readonly onMessage: (channel: 'sms' | 'email') => void;
}) {
  const { t } = useTranslation('managers');
  const detail = useManagerDetail(managerId);

  return (
    <section>
      <PageHeader
        title={t('detailTitle')}
        breadcrumbs={[t('path.settings'), t('path.managers'), t('path.detail')]}
        actions={
          detail.data ? (
            <>
              <Button onClick={() => onMessage('sms')}>{t('actions.sms')}</Button>
              {detail.data.accountStatus !== 'awaiting' ? (
                <Button onClick={() => onMessage('email')}>{t('actions.email')}</Button>
              ) : null}
            </>
          ) : null
        }
      />
      <DetailStateBoundary query={detail}>
        {(manager) => <ManagerDetailContent manager={manager} onEdit={onEdit} />}
      </DetailStateBoundary>
    </section>
  );
}

function ManagerDetailContent({
  manager,
  onEdit,
}: {
  readonly manager: ManagerDetail;
  readonly onEdit: (managerId: string) => void;
}) {
  const { t } = useTranslation('managers');
  const { t: shared } = useTranslation('shared');
  const { locale } = useLocale();
  const action = useMutation(managerActionMutation(locale));
  const [inputAction, setInputAction] = useState<ManagerInputAction>();
  const confirmation = useConfirmation<ConfirmAction>({
    run: (type) => action.mutateAsync({ type, managerId: manager.id }),
    description: (type) =>
      type === 'delete' ? shared('deleteConfirm.description') : t(`actions.${type}Description`),
    confirmLabel: (type) => (type === 'approve' ? t('actions.approveConfirm') : shared('formSave.confirm')),
  });
  const status = manager.accountStatus;
  const editable = status === 'active' || status === 'inactive' || status === 'locked';
  const empty = t('detail.emptyValue');
  const text = (value: string) => (value === '' ? empty : value);

  return (
    <div className="space-y-5">
      <SectionCard title={t('detail.section')}>
        <dl className="grid md:grid-cols-2 md:gap-x-8">
          <DetailField label={t('fields.type')}>{manager.type.label}</DetailField>
          <DetailField label={t('fields.id')}>{manager.id}</DetailField>
          <DetailField label={t('form.password')}>
            <Button disabled={!editable} onClick={() => setInputAction('password')}>
              {t('actions.password')}
            </Button>
          </DetailField>
          <DetailField label={t('fields.name')}>{text(manager.name)}</DetailField>
          <DetailField label={t('fields.phone')}>{manager.phone ? maskPhone(manager.phone) : empty}</DetailField>
          <DetailField label={t('fields.email')}>{manager.email ? maskEmail(manager.email) : empty}</DetailField>
          <DetailField label={t('fields.organization')}>{text(manager.organization)}</DetailField>
          <DetailField label={t('fields.permission')}>{manager.permission.label}</DetailField>
          <DetailField label={t('fields.registrationRoute')}>{manager.registrationRoute}</DetailField>
          <DetailField label={t('fields.accountStatus')}>
            <Badge tone={statusTone[status]}>{t(`accountStatus.${status}`)}</Badge>
            {status === 'active' ? (
              <Button onClick={() => confirmation.request('deactivate')}>{t('actions.deactivate')}</Button>
            ) : null}
            {status === 'inactive' ? (
              <Button onClick={() => confirmation.request('activate')}>{t('actions.activate')}</Button>
            ) : null}
            {status === 'locked' ? (
              <Button onClick={() => setInputAction('unlock')}>{t('actions.unlock')}</Button>
            ) : null}
          </DetailField>
          <DetailField label={t('fields.joinedAt')}>{formatDate(manager.joinedAt) || empty}</DetailField>
          {status === 'rejected' && manager.statusReason ? (
            <DetailField label={t('detail.statusReason')}>{manager.statusReason}</DetailField>
          ) : null}
        </dl>
      </SectionCard>
      <Actions>
        {status !== 'rejected' ? (
          <Button onClick={() => setInputAction('reveal')}>{t('actions.reveal')}</Button>
        ) : null}
        {status === 'awaiting' ? (
          <>
            <Button onClick={() => confirmation.request('approve')}>{t('actions.approve')}</Button>
            <Button onClick={() => setInputAction('reject')}>{t('actions.reject')}</Button>
          </>
        ) : null}
        {status === 'rejected' ? (
          <Button onClick={() => confirmation.request('delete')}>{t('actions.delete')}</Button>
        ) : null}
        {editable ? (
          <Button onClick={() => setInputAction('verifyWithdrawal')}>{t('actions.verifyWithdrawal')}</Button>
        ) : null}
      </Actions>
      <SectionCard title={t('detail.history')}>
        <UpdateHistory
          entries={toManagerHistoryEntries(manager.changeLogs, t)}
          labels={{
            date: t('detail.historyDate'),
            change: t('detail.historyChange'),
            actor: t('detail.historyManager'),
          }}
          emptyText={t('detail.historyEmpty')}
        />
      </SectionCard>
      {editable ? (
        <Actions>
          <Button onClick={() => onEdit(manager.id)}>{t('form.editAction')}</Button>
        </Actions>
      ) : null}
      {confirmation.dialog}
      {inputAction ? (
        <ManagerActionForm
          key={inputAction}
          action={inputAction}
          managerId={manager.id}
          onClose={() => setInputAction(undefined)}
          run={(request) => action.mutateAsync(request)}
        />
      ) : null}
    </div>
  );
}

function Actions({ children }: { readonly children: ReactNode }) {
  return <div className="flex justify-center gap-2">{children}</div>;
}
