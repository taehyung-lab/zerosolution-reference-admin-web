import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ticketIssueBulkChanges,
  ticketIssueDownloadScopes,
  type TicketIssueListRequest,
} from '@/features/ticketing/model/ticket-issue';
import { AlertDialog } from '@/shared/ui/dialog/AlertDialog';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { Button } from '@/shared/ui/primitives/Button';
import { Select } from '@/shared/ui/primitives/Select';
import {
  parseTicketIssueBulkChange,
  ticketIssueBulkChangeValue,
  useTicketIssueListActions,
} from '../model/useTicketIssueListActions';

/**
 * fact 「toolbar」 우측: `선택 ▾`(cascade 발권상태 > 발권취소 · 분실) + `변경` · `다운로드 ▾` + `다운로드`.
 * 일괄변경은 원문의 3단계를 그대로 돈다 — 미선택 오류 alert → `선택 항목을 변경하시겠습니까?` 확인
 * alert → `변경되었습니다.` 완료 alert. 완료를 확인하면 선택이 풀리고, 무효화된 조회가 바뀐 상태를
 * 다시 그린다(원문 `확인 : alert 닫히고, 변경 상태로 화면 갱신됨`).
 * 다운로드는 원문에 확인·완료 alert 가 없어 미선택 거절만 지나고 바로 실행한다.
 *
 * alert·확인창의 수명은 늘 mount 되는 이 컴포넌트가 소유해 조회 상태가 바뀌어도 열린 팝업이 사라지지
 * 않는다. 검색 전에 가리는 것은 버튼이지 다이얼로그 소유자가 아니다.
 */
export function TicketIssueListActions({
  searched,
  selectedIds,
  request,
  onChanged,
}: {
  readonly searched: boolean;
  readonly selectedIds: readonly string[];
  readonly request: TicketIssueListRequest;
  readonly onChanged: () => void;
}) {
  const { t } = useTranslation('ticketing');
  const { t: shared } = useTranslation('shared');
  const actions = useTicketIssueListActions({ selectedIds, request });
  const [completed, setCompleted] = useState(false);
  const confirmation = useConfirmation({
    run: async (input: Parameters<typeof actions.runBulkChange>[0]) => {
      await actions.runBulkChange(input);
      setCompleted(true);
    },
    description: shared('bulkAction.confirm'),
  });
  const requestBulkChange = () => {
    const input = actions.prepareBulkChange();
    if (input !== undefined) confirmation.request(input);
  };

  return (
    <>
      {searched ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label={t('issue.result.bulkField')}
            className="w-52"
            placeholder={t('issue.result.bulkPlaceholder')}
            value={actions.target === undefined ? null : ticketIssueBulkChangeValue(actions.target)}
            options={ticketIssueBulkChanges.map((change) => ({
              value: ticketIssueBulkChangeValue(change),
              label: t('issue.result.bulkOption', {
                value: t(`issue.values.issueStatus.${change.value}`),
              }),
            }))}
            onValueChange={(value) => actions.setTarget(parseTicketIssueBulkChange(value))}
          />
          <Button onClick={requestBulkChange}>{t('issue.result.bulkChange')}</Button>
          <Select
            aria-label={t('issue.result.downloadField')}
            className="w-48"
            placeholder={t('issue.result.downloadPlaceholder')}
            value={actions.downloadScope ?? null}
            options={ticketIssueDownloadScopes.map((scope) => ({
              value: scope,
              label: t(`issue.result.downloadScope.${scope}`),
            }))}
            onValueChange={(value) =>
              actions.setDownloadScope(ticketIssueDownloadScopes.find((scope) => scope === value))
            }
          />
          <Button
            className="bg-white text-neutral-900 ring-1 ring-neutral-300"
            onClick={actions.requestDownload}
          >
            {t('issue.result.download')}
          </Button>
        </div>
      ) : null}
      <SelectionAlert controller={actions.gate} />
      {confirmation.dialog}
      <AlertDialog
        open={completed}
        onOpenChange={(open) => {
          if (!open) setCompleted(false);
        }}
        title={shared('alert.title')}
        description={shared('bulkAction.completed')}
        acknowledgeLabel={shared('bulkAction.acknowledge')}
        onAcknowledge={onChanged}
      />
    </>
  );
}
