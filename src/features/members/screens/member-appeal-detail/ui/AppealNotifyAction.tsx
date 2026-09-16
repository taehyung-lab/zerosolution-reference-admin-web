import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppealRecord } from '@/features/members/model/member-records';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { Button } from '@/shared/ui/primitives/Button';
import { Dialog } from '@/shared/ui/primitives/Dialog';

/**
 * `회원에게 결과 통보하기`: 저장된 처리 결과(완료·거절)를 미리 보여 주고 확인을 지나 요청 함수에 닿는다.
 * 작성 중인 폼 값은 통보 대상이 아니고, 이미 통보한 소명은 다시 보내지 않는다.
 */
export function AppealNotifyAction({
  record,
  onNotify,
}: {
  readonly record: AppealRecord;
  readonly onNotify: () => Promise<unknown>;
}) {
  const { t } = useTranslation('members');
  const { t: shared } = useTranslation('shared');
  const [open, setOpen] = useState(false);
  const confirmation = useConfirmation({ run: onNotify, description: t('appeal.confirmNotify') });
  const { processing } = record;
  const decided = processing.result === 'completed' || processing.result === 'rejected';

  return (
    <>
      <Button disabled={record.notified || !decided} onClick={() => setOpen(true)}>
        {t('appeal.notify')}
      </Button>
      <Dialog open={open} title={t('appeal.notify')} onOpenChange={setOpen} closeLabel={shared('formAction.cancel')}>
        <dl>
          <DetailField label={t('fields.result')}>{t(`states.${processing.result}`)}</DetailField>
          {processing.result === 'rejected' ? (
            <>
              <DetailField label={t('appeal.reason')}>
                {processing.reason === '' ? t('appeal.choose') : t(`appeal.${processing.reason}`)}
              </DetailField>
              {processing.reason === 'other' ? <DetailField label={t('appeal.direct')}>{processing.direct}</DetailField> : null}
            </>
          ) : null}
        </dl>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => confirmation.request()}>{t('appeal.send')}</Button>
          <Button onClick={() => setOpen(false)}>{shared('formAction.cancel')}</Button>
        </div>
      </Dialog>
      {confirmation.dialog}
    </>
  );
}
