import { useTranslation } from 'react-i18next';
import { MemberBulkChangeControl } from '@/features/members/mechanics/bulk-change/ui/MemberBulkChangeControl';
import { memberRestrictions, type MemberMessageChannel } from '@/features/members/model/member';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { Button } from '@/shared/ui/primitives/Button';
import { useMemberListActions } from '../model/useMemberListActions';

/**
 * 결과 toolbar 우측: `변경 항목 ▾ + 변경` · `SMS` · `이메일`(검색 뒤에만) · `등록`.
 * 확인 lifecycle 과 alert·확인창의 수명은 이 컴포넌트가 소유한다 — 입력 컨트롤은 검색 전에 숨겨지지만
 * 팝업은 그 조건 밖에서 렌더해 조회 상태가 바뀌어도 열린 채로 남는다.
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
  const { t: shared } = useTranslation('shared');
  const actions = useMemberListActions(selectedIds, onMessage);
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
        {searched ? (
          <>
            <MemberBulkChangeControl
              bulk={actions.bulk}
              restrictions={memberRestrictions}
              onRequestChange={requestBulkChange}
            />
            <Button onClick={() => actions.requestMessage('sms')}>{t('actions.sms')}</Button>
            <Button onClick={() => actions.requestMessage('email')}>{t('actions.email')}</Button>
          </>
        ) : null}
        <Button onClick={onCreate}>{t('actions.register')}</Button>
      </div>
      <SelectionAlert controller={actions.gate} />
      {confirmation.dialog}
    </>
  );
}
