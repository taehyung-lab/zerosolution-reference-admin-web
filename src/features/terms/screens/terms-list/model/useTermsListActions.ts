import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  bulkChangeTermsMutation,
  copyTermsMutation,
  type TermsBulkChangeRequest,
} from '@/features/terms/api/mutations';
import { termsStatuses, type TermsBulkChange } from '@/features/terms/model/terms';
import { useLocale } from '@/shared/i18n/locale-context';
import { errorMessageKey, errorTraceOf } from '@/shared/lib/error-copy';
import { useSelectionGate } from '@/shared/hooks/use-selection-gate';

/**
 * Case 정의의 cascade `선택 ▾ > 게시 상태 > 게시 · 게시안함` 이 가진 leaf 전부. 공용 `Select` 는 단일
 * 계층 계약이라 leaf 를 한 목록으로 펼쳐 고르고, 축과 값의 쌍은 그대로 요청 입력에 실린다.
 */
export const termsBulkChanges: readonly TermsBulkChange[] = termsStatuses.map(
  (value) => ({ field: 'status', value }) as const,
);

/** select 값 ↔ cascade leaf. `field:value` 한 문자열이며 URL 로 나가지 않는다. */
export function termsBulkChangeValue(change: TermsBulkChange): string {
  return `${change.field}:${change.value}`;
}

export function parseTermsBulkChange(value: string | null): TermsBulkChange | undefined {
  return termsBulkChanges.find((change) => termsBulkChangeValue(change) === value);
}

/**
 * 결과 toolbar 의 `선택 ▾ + 변경` 과 `선택복사` 두 액션의 **선택 전제와 실행**을 소유한다. 확인창의
 * 상태와 렌더는 늘 mount 되는 Actions 컴포넌트가 갖는다 — 이 훅은 JSX 를 모른다.
 * 원문 Case01(미선택 오류 alert)은 두 액션 모두, Case02(변경 확인 alert)와 완료 alert 은 일괄변경에만
 * 적혀 있다. 선택복사의 확인·완료 alert 은 미확인이라(TERMS-LIST 미확인 4) 만들지 않는다.
 */
export function useTermsListActions(selectedIds: readonly string[]) {
  const { t } = useTranslation('shared');
  const { locale } = useLocale();
  const [target, setTarget] = useState<TermsBulkChange | undefined>(undefined);
  const gate = useSelectionGate(selectedIds.length);
  const bulkChange = useMutation(bulkChangeTermsMutation(locale));
  const copy = useMutation(copyTermsMutation(locale));

  return {
    gate,
    target,
    setTarget,
    /** 변경할 값을 고르지 않았으면 보낼 업무가 없으므로 요청도 만들지 않는다. */
    prepareBulkChange: (): TermsBulkChangeRequest | undefined => {
      if (!gate.requireSelection(t('bulkAction.missingSelection'))) return undefined;
      if (target === undefined) return undefined;
      return { targetIds: [...selectedIds], change: target };
    },
    runBulkChange: (request: TermsBulkChangeRequest) => bulkChange.mutateAsync(request),
    requestCopy: () => {
      if (!gate.requireSelection(t('bulkAction.missingSelection'))) return;
      copy.mutate(
        { targetIds: [...selectedIds] },
        { onError: (error) => gate.reject(t(errorMessageKey(errorTraceOf(error).kind))) },
      );
    },
  };
}
