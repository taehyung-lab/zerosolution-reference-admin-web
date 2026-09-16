import { useTranslation } from 'react-i18next';
import { MemberBulkChangeControl } from '@/features/members/mechanics/bulk-change/ui/MemberBulkChangeControl';
import type { MemberMessageChannel } from '@/features/members/model/member';
import { appealRestrictions } from '@/features/members/model/member-records';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { Button } from '@/shared/ui/primitives/Button';
import { useAppealListActions } from '../model/useAppealListActions';

/** 결과 toolbar 우측: `변경 항목 ▾ + 변경` · `SMS` · `이메일`. 소명은 입장제한을 다루지 않는다. */
export function AppealListActions({
  selectedIds,
  onMessage,
}: {
  readonly selectedIds: readonly string[];
  readonly onMessage: (channel: MemberMessageChannel, ids: readonly string[]) => void;
}) {
  const { t } = useTranslation('members');
  const actions = useAppealListActions(selectedIds, onMessage);

  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        <MemberBulkChangeControl bulk={actions.bulk} restrictions={appealRestrictions} />
        <Button onClick={() => actions.requestMessage('sms')}>{t('actions.sms')}</Button>
        <Button onClick={() => actions.requestMessage('email')}>{t('actions.email')}</Button>
      </div>
      <SelectionAlert controller={actions.gate} />
      {actions.bulk.dialog}
    </>
  );
}
