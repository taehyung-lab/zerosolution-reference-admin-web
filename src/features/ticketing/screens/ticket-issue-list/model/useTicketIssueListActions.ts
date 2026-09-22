import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  bulkChangeTicketIssuesMutation,
  downloadTicketIssuesMutation,
  type TicketIssueBulkChangeRequest,
  type TicketIssueDownloadRequest,
} from '@/features/ticketing/api/mutations';
import {
  ticketIssueBulkChanges,
  type TicketIssueBulkChange,
  type TicketIssueDownloadScope,
  type TicketIssueListRequest,
} from '@/features/ticketing/model/ticket-issue';
import { useLocale } from '@/shared/i18n/locale-context';
import { errorMessageKey, errorTraceOf } from '@/shared/lib/error-copy';
import { useSelectionGate } from '@/shared/hooks/use-selection-gate';

/** select 값 ↔ cascade leaf. `field:value` 한 문자열이며 URL 로 나가지 않는다. */
export function ticketIssueBulkChangeValue(change: TicketIssueBulkChange): string {
  return `${change.field}:${change.value}`;
}

export function parseTicketIssueBulkChange(value: string | null): TicketIssueBulkChange | undefined {
  return ticketIssueBulkChanges.find((change) => ticketIssueBulkChangeValue(change) === value);
}

/**
 * 결과 toolbar 의 `선택 ▾ + 변경` 과 `다운로드 ▾ + 다운로드` 두 액션의 **선택 전제와 실행**을 소유한다.
 * 확인창의 상태와 렌더는 늘 mount 되는 Actions 컴포넌트가 갖는다 — 이 훅은 JSX 를 모른다.
 *
 * 원문의 도달 조건 그대로다. 일괄변경은 Case01(미선택 오류) → Case02(변경 확인 → 변경 완료).
 * 다운로드는 Case01(`선택한 항목` + 선택 있음) · Case02(`선택한 항목` + 선택 없음 = 오류) ·
 * Case03(`검색결과 전체` 는 선택과 무관). 다운로드에는 확인·완료 alert 가 원문에 없어 만들지 않는다.
 * 범위를 고르지 않은 상태의 처리는 원문이 말하지 않으므로 보낼 업무가 없는 것으로 둔다
 * (`product/facts/TICKET-ISSUE-LIST.md` 미확인 8).
 */
export function useTicketIssueListActions({
  selectedIds,
  request,
}: {
  readonly selectedIds: readonly string[];
  readonly request: TicketIssueListRequest;
}) {
  const { t } = useTranslation('shared');
  const { locale } = useLocale();
  const [target, setTarget] = useState<TicketIssueBulkChange | undefined>(undefined);
  const [downloadScope, setDownloadScope] = useState<TicketIssueDownloadScope | undefined>(undefined);
  const gate = useSelectionGate(selectedIds.length);
  const bulkChange = useMutation(bulkChangeTicketIssuesMutation(locale));
  const download = useMutation(downloadTicketIssuesMutation());

  return {
    gate,
    target,
    setTarget,
    downloadScope,
    setDownloadScope,
    /** 변경할 값을 고르지 않았으면 보낼 업무가 없으므로 요청도 만들지 않는다. */
    prepareBulkChange: (): TicketIssueBulkChangeRequest | undefined => {
      if (!gate.requireSelection(t('bulkAction.missingSelection'))) return undefined;
      if (target === undefined) return undefined;
      return { targetIds: [...selectedIds], change: target };
    },
    runBulkChange: (input: TicketIssueBulkChangeRequest) => bulkChange.mutateAsync(input),
    requestDownload: () => {
      if (downloadScope === undefined) return;
      if (downloadScope === 'SELECTED' && !gate.requireSelection(t('bulkAction.missingSelection'))) return;
      const input: TicketIssueDownloadRequest = {
        scope: downloadScope,
        targetIds: downloadScope === 'SELECTED' ? [...selectedIds] : [],
        search: request,
      };
      download.mutate(input, {
        onError: (error) => gate.reject(t(errorMessageKey(errorTraceOf(error).kind))),
      });
    },
  };
}
