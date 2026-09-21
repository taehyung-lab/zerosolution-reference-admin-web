import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { bulkChangeContentsMutation } from '@/features/performances/api/mutations';
import type { ContentBulkChangeRequest, ContentUsageStatus } from '@/features/performances/model/content';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSelectionGate } from '@/shared/hooks/use-selection-gate';

/**
 * 결과 toolbar 우측의 유일한 액션: `선택 ▾`(cascade `사용 상태 > 사용 / 사용안함`) + `변경`.
 * 미선택과 값 미선택은 같은 alert 하나로 거절한다(Notion Case01). 확인 → 호출 → 완료 alert 의 수명은
 * 컴포넌트가 소유하고, 여기는 대상·값·거절 규칙만 정한다.
 */
export function useContentListActions(selectedIds: readonly string[]) {
  const { locale } = useLocale();
  const gate = useSelectionGate(selectedIds.length);
  const bulkChange = useMutation(bulkChangeContentsMutation(locale));
  const [usageStatus, setUsageStatus] = useState<ContentUsageStatus | null>(null);

  return {
    gate,
    usageStatus,
    setUsageStatus,
    /** 선택과 cascade 값이 모두 성립하면 요청을, 아니면 `undefined` 를 준다. */
    prepareBulkChange: (missingSelectionMessage: string, missingValueMessage: string):
      | ContentBulkChangeRequest
      | undefined => {
      if (!gate.requireSelection(missingSelectionMessage)) return undefined;
      if (usageStatus === null) {
        gate.reject(missingValueMessage);
        return undefined;
      }
      return { targetIds: [...selectedIds], usageStatus };
    },
    runBulkChange: (request: ContentBulkChangeRequest) => bulkChange.mutateAsync(request),
  };
}
