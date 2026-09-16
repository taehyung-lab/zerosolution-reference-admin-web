import { useTranslation } from 'react-i18next';
import type { MemberMessageChannel } from '@/features/members/model/member';
import { useSelectionGate } from '@/shared/model/use-selection-gate';

/** toolbar 의 SMS·이메일 작성: 선택이 있어야 채널과 대상을 화면 밖으로 알린다. 발송은 route 가 조립한다. */
export function useDormantListActions(
  selectedIds: readonly string[],
  onMessage: (channel: MemberMessageChannel, ids: readonly string[]) => void,
) {
  const { t } = useTranslation('members');
  const gate = useSelectionGate(selectedIds.length);
  return {
    gate,
    requestMessage: (channel: MemberMessageChannel) => {
      if (gate.requireSelection(t(`actions.${channel}Missing`))) onMessage(channel, selectedIds);
    },
  };
}
