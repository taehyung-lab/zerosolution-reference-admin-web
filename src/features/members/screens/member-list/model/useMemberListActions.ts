import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { bulkChangeMembersMutation } from '@/features/members/api/mutations';
import { useMemberBulkChange } from '@/features/members/mechanics/bulk-change/model/useMemberBulkChange';
import type { MemberMessageChannel } from '@/features/members/model/member';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSelectionGate } from '@/shared/model/use-selection-gate';

/**
 * 결과 toolbar 의 세 액션: 일괄변경(선택 + 값 + 확인 → mutation), SMS·이메일 작성(선택 → 화면 밖으로 알림).
 * 미선택은 한 alert 로 거절한다. 발송 자체는 다른 도메인이라 route 가 조립하고 이 화면은 채널과 대상만 알린다.
 */
export function useMemberListActions(
  selectedIds: readonly string[],
  onMessage: (channel: MemberMessageChannel, ids: readonly string[]) => void,
) {
  const { t } = useTranslation('members');
  const { locale } = useLocale();
  const gate = useSelectionGate(selectedIds.length);
  const bulkChange = useMutation(bulkChangeMembersMutation(locale));
  const bulk = useMemberBulkChange({ selectedIds, gate, run: (request) => bulkChange.mutateAsync(request) });

  return {
    gate,
    bulk,
    requestMessage: (channel: MemberMessageChannel) => {
      if (gate.requireSelection(t(`actions.${channel}Missing`))) onMessage(channel, selectedIds);
    },
  };
}
