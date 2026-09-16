import { useTranslation } from 'react-i18next';
import type { MemberMessageChannel } from '@/features/members/model/member';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { Button } from '@/shared/ui/primitives/Button';
import { useDormantListActions } from '../model/useDormantListActions';

/** 결과 toolbar 우측: `SMS` · `이메일`(검색 뒤에만) · `등록`. alert 의 수명은 이 컴포넌트가 소유한다. */
export function DormantListActions({
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
  const actions = useDormantListActions(selectedIds, onMessage);

  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        {searched ? (
          <>
            <Button onClick={() => actions.requestMessage('sms')}>{t('actions.sms')}</Button>
            <Button onClick={() => actions.requestMessage('email')}>{t('actions.email')}</Button>
          </>
        ) : null}
        <Button onClick={onCreate}>{t('actions.register')}</Button>
      </div>
      <SelectionAlert controller={actions.gate} />
    </>
  );
}
