import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { bulkChangeAppealsMutation } from '@/features/members/api/mutations';
import { useMemberBulkChange } from '@/features/members/shared/bulk-change/model/useMemberBulkChange';
import type { MemberBulkChangeRequest, MemberMessageChannel } from '@/features/members/model/member';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSelectionGate } from '@/shared/hooks/use-selection-gate';

/** 결과 toolbar 의 세 액션: 소명 회원 일괄변경(선택 + 값 + 확인 → mutation), SMS·이메일 작성(선택 → 화면 밖으로 알림). */
export function useAppealListActions(
  selectedIds: readonly string[],
  onMessage: (channel: MemberMessageChannel, ids: readonly string[]) => void,
) {
  const { t } = useTranslation('members');
  const { locale } = useLocale();
  const gate = useSelectionGate(selectedIds.length);
  const bulkChange = useMutation(bulkChangeAppealsMutation(locale));
  const bulk = useMemberBulkChange({ selectedIds, gate });

  return {
    gate,
    bulk,
    runBulkChange: (request: MemberBulkChangeRequest) => bulkChange.mutateAsync(request),
    requestMessage: (channel: MemberMessageChannel) => {
      if (gate.requireSelection(t(`actions.${channel}Missing`))) onMessage(channel, selectedIds);
    },
  };
}
