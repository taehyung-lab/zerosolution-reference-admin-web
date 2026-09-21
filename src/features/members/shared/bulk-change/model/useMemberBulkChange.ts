import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  completedBulkChange,
  type MemberBulkChange,
  type MemberBulkChangeRequest,
} from '@/features/members/model/member';
import type { useSelectionGate } from '@/shared/hooks/use-selection-gate';

/**
 * `변경 항목 ▾(일반회원 | 불량회원 ▸ 활동제한) + 변경` 일괄변경의 종속 값과 선택 전제. 두 목록 화면이 같은
 * 절차를 쓰고 mutation 만 다르므로 그 실행과 확인은 여기 두지 않는다 — 각 화면의 Actions 가 자기 mutation 으로
 * 확인 lifecycle 을 만든다. 모든 사전 검증은 화면의 한 선택 alert(`gate`)로 거절해 값을 고친 뒤 오래된
 * 개별 오류가 남지 않는다.
 */
export function useMemberBulkChange({
  selectedIds,
  gate,
}: {
  readonly selectedIds: readonly string[];
  readonly gate: ReturnType<typeof useSelectionGate>;
}) {
  const { t } = useTranslation('members');
  const { t: shared } = useTranslation('shared');
  const [change, setChange] = useState<MemberBulkChange | null>(null);

  return {
    change,
    setChange,
    /** 선택과 종속 값이 모두 성립하면 요청을, 아니면 `undefined` 를 준다. 거절은 여기서 한 alert 로 끝난다. */
    prepareBulkChange: (): MemberBulkChangeRequest | undefined => {
      if (!gate.requireSelection(shared('bulkAction.missingSelection'))) return undefined;
      const ready = completedBulkChange(change);
      if (ready === undefined) {
        gate.reject(t('bulk.incomplete'));
        return undefined;
      }
      return {
        targetIds: [...selectedIds],
        accountStatus: ready.accountStatus,
        restrictions: ready.accountStatus === 'flagged' ? [...ready.restrictions] : [],
      };
    },
  };
}

export type MemberBulkChangeControls = ReturnType<typeof useMemberBulkChange>;
