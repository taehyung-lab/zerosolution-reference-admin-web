import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createCounselNoteMutation,
  deleteCounselNoteMutation,
  reissueTicketMutation,
  updateCounselNoteMutation,
} from '@/features/members/api/mutations';
import { useCounselDetail } from '@/features/members/api/useCounselDetail';
import { useCounselReissueInput } from '@/features/members/api/useCounselOptions';
import { formatMemberInstant } from '@/features/members/lib/format-member-instant';
import { MemberCounselRecords } from '@/features/members/mechanics/counsel/ui/MemberCounselRecords';
import { useLocale } from '@/shared/i18n/locale-context';
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { useUnsavedChangesGuard } from '@/shared/ui/form/UnsavedChangesGuard';
import { Button } from '@/shared/ui/primitives/Button';
import { Dialog } from '@/shared/ui/primitives/Dialog';
import { ReissueDialog } from './ReissueDialog';

/**
 * 목록 위의 상담 팝업: 문의 내용 · 상담 기록(신규·수정·삭제, 재발행 유형이면 티켓재발권) · 회원·예매 정보.
 * 상세를 팝업으로 여는 것 외에는 route 상세와 같은 형태다 — 조회 훅 → 상태 경계 → 내용. 기록 폼이 dirty 면 닫기 전에 묻는다.
 */
export function CounselDetailDialog({ counselId, onClose }: { readonly counselId: string; readonly onClose: () => void }) {
  const { t } = useTranslation('members');
  const { t: shared } = useTranslation('shared');
  const { locale } = useLocale();
  const detail = useCounselDetail(counselId);
  const createNote = useMutation(createCounselNoteMutation(locale));
  const updateNote = useMutation(updateCounselNoteMutation(locale));
  const deleteNote = useMutation(deleteCounselNoteMutation(locale));
  const reissue = useMutation(reissueTicketMutation(locale));
  const printing = useCounselReissueInput();
  const [dirty, setDirty] = useState(false);
  const guard = useUnsavedChangesGuard({ when: dirty });
  const [reissueNoteId, setReissueNoteId] = useState<string>();

  return (
    <>
      <Dialog
        open
        title={t('screens.counsel')}
        closeLabel={shared('formAction.cancel')}
        onOpenChange={(open) => {
          if (!open) guard.close(onClose);
        }}
      >
        <DetailStateBoundary query={detail}>
          {(counsel) => (
            <div className="space-y-4">
              <h2>{t('fields.content')}</h2>
              <p>{counsel.content}</p>
              <p>{formatMemberInstant(counsel.receivedAt)}</p>
              <MemberCounselRecords
                records={{
                  rows: counsel.records,
                  searched: true,
                  isPending: false,
                  isFetching: false,
                  isError: false,
                  retry: detail.retry,
                }}
                operatorName={t('counsel.defaultOperator')}
                onCreate={(input) => createNote.mutateAsync({ counselId, input })}
                onUpdate={(noteId, input) => updateNote.mutateAsync({ counselId, noteId, input })}
                onDelete={(noteId) => deleteNote.mutateAsync({ counselId, noteId })}
                onDirtyChange={setDirty}
                recordAction={(record) =>
                  record.inquiryType.startsWith('reprint') ? (
                    <Button type="button" onClick={() => setReissueNoteId(record.id)}>
                      {t('reissue.title')}
                    </Button>
                  ) : null
                }
              />
              <h2>{t('counselDetail.member')}</h2>
              <dl>
                <DetailField label={t('fields.email')}>{maskEmail(counsel.email)}</DetailField>
                <DetailField label={t('fields.name')}>{counsel.name}</DetailField>
                <DetailField label={t('fields.phone')}>{maskPhone(counsel.phone)}</DetailField>
                <DetailField label={t('fields.accountStatus')}>{t(`accountStatus.${counsel.accountStatus}`)}</DetailField>
              </dl>
              {counsel.booking ? (
                <>
                  <h2>{t('counselDetail.performance')}</h2>
                  <p>{counsel.booking.performance}</p>
                  <h2>{t('counselDetail.booking')}</h2>
                  <p>{counsel.booking.booking}</p>
                  <h2>{t('counselDetail.booker')}</h2>
                  <p>{counsel.booking.booker}</p>
                </>
              ) : null}
            </div>
          )}
        </DetailStateBoundary>
      </Dialog>
      {guard.dialog}
      {reissueNoteId ? (
        <ReissueDialog
          printing={printing}
          onClose={() => setReissueNoteId(undefined)}
          onRequest={(input) => reissue.mutateAsync({ counselId, noteId: reissueNoteId, ...input })}
        />
      ) : null}
    </>
  );
}
