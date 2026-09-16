import { useTranslation } from 'react-i18next';
import { MemberBulkChangeControl } from '@/features/members/mechanics/bulk-change/ui/MemberBulkChangeControl';
import type { MemberMessageChannel } from '@/features/members/model/member';
import { appealRestrictions } from '@/features/members/model/member-records';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { Button } from '@/shared/ui/primitives/Button';
import { useAppealListActions } from '../model/useAppealListActions';

/**
 * 결과 toolbar 우측: `변경 항목 ▾ + 변경` · `SMS` · `이메일`. 소명은 입장제한을 다루지 않는다.
 * 확인 lifecycle 과 팝업의 수명은 이 컴포넌트가 소유한다.
 */
export function AppealListActions({
  selectedIds,
  onMessage,
}: {
  readonly selectedIds: readonly string[];
  readonly onMessage: (channel: MemberMessageChannel, ids: readonly string[]) => void;
}) {
  const { t } = useTranslation('members');
  const { t: shared } = useTranslation('shared');
  const actions = useAppealListActions(selectedIds, onMessage);
  const confirmation = useConfirmation({
    run: actions.runBulkChange,
    description: shared('bulkAction.confirm'),
  });
  const requestBulkChange = () => {
    const request = actions.bulk.prepareBulkChange();
    if (request !== undefined) confirmation.request(request);
  };

  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        <MemberBulkChangeControl
          bulk={actions.bulk}
          restrictions={appealRestrictions}
          onRequestChange={requestBulkChange}
        />
        <Button onClick={() => actions.requestMessage('sms')}>{t('actions.sms')}</Button>
        <Button onClick={() => actions.requestMessage('email')}>{t('actions.email')}</Button>
      </div>
      <SelectionAlert controller={actions.gate} />
      {confirmation.dialog}
    </>
  );
}
