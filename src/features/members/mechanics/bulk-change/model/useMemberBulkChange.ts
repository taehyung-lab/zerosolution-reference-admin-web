import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  completedBulkChange,
  type MemberBulkChange,
  type MemberBulkChangeRequest,
} from '@/features/members/model/member';
import type { useSelectionGate } from '@/shared/model/use-selection-gate';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';

/**
 * `변경 항목 ▾(일반회원 | 불량회원 ▸ 활동제한) + 변경` 일괄변경의 종속 값·선택 전제·확인·실행. 활성 회원 목록과
 * 소명 목록이 같은 절차를 쓰고 mutation 만 다르다. 모든 사전 검증은 화면의 한 선택 alert(`gate`)로 거절해
 * 값을 고친 뒤 오래된 개별 오류가 남지 않는다. `dialog` 는 호출한 toolbar 가 늘 mount 해 조회 상태가
 * 바뀌어도 열린 확인창이 사라지지 않게 한다.
 */
export function useMemberBulkChange({
  selectedIds,
  gate,
  run,
}: {
  readonly selectedIds: readonly string[];
  readonly gate: ReturnType<typeof useSelectionGate>;
  readonly run: (request: MemberBulkChangeRequest) => Promise<unknown>;
}) {
  const { t } = useTranslation('members');
  const { t: shared } = useTranslation('shared');
  const [change, setChange] = useState<MemberBulkChange | null>(null);
  const confirmation = useConfirmation<MemberBulkChangeRequest>({ run, description: shared('bulkAction.confirm') });

  return {
    change,
    setChange,
    dialog: confirmation.dialog,
    request: () => {
      if (!gate.requireSelection(shared('bulkAction.missingSelection'))) return;
      const ready = completedBulkChange(change);
      if (ready === undefined) {
        gate.reject(t('bulk.incomplete'));
        return;
      }
      confirmation.request({
        targetIds: [...selectedIds],
        accountStatus: ready.accountStatus,
        restrictions: ready.accountStatus === 'flagged' ? [...ready.restrictions] : [],
      });
    },
  };
}

export type MemberBulkChangeControls = ReturnType<typeof useMemberBulkChange>;
