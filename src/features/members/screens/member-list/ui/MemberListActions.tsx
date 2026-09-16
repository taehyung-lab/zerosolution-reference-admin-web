import { useTranslation } from 'react-i18next';
import { MemberBulkChangeControl } from '@/features/members/mechanics/bulk-change/ui/MemberBulkChangeControl';
import { memberRestrictions, type MemberMessageChannel } from '@/features/members/model/member';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { Button } from '@/shared/ui/primitives/Button';
import { useMemberListActions } from '../model/useMemberListActions';

/**
 * 결과 toolbar 우측: `변경 항목 ▾ + 변경` · `SMS` · `이메일`(검색 뒤에만) · `등록`.
 * alert 와 확인창의 수명은 이 컴포넌트가 소유해 조회 상태가 바뀌어도 열린 팝업이 사라지지 않는다.
 */
export function MemberListActions({
  searched,
  selectedIds,
  onCreate,
  onMessage,
}: {
  readonly searched: boolean;
  readonly selectedIds: readonly string[];
  readonly onCreate: () => void;
  readonly onMessage: (channel: MemberMessageChannel, ids: readonly string[]) => void;
}) {
  const { t } = useTranslation('members');
  const actions = useMemberListActions(selectedIds, onMessage);

  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        {searched ? (
          <>
            <MemberBulkChangeControl bulk={actions.bulk} restrictions={memberRestrictions} />
            <Button onClick={() => actions.requestMessage('sms')}>{t('actions.sms')}</Button>
            <Button onClick={() => actions.requestMessage('email')}>{t('actions.email')}</Button>
          </>
        ) : null}
        <Button onClick={onCreate}>{t('actions.register')}</Button>
      </div>
      <SelectionAlert controller={actions.gate} />
      {actions.bulk.dialog}
    </>
  );
}
