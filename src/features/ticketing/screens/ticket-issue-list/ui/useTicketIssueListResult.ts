import { useTranslation } from 'react-i18next';
import type { TicketIssueRow } from '@/features/ticketing/model/ticket-issue';
import { usePageRowSelection } from '@/shared/hooks/use-page-row-selection';
import { useLocale } from '@/shared/i18n/locale-context';
import { listViewControls } from '@/shared/lib/list-view';
import type { TicketIssueListView } from '../model/ticket-issue-list-search';
import { ticketIssueListColumns } from './ticket-issue-list-columns';

/**
 * 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다.
 * 선택은 확정된 한 화면(committed search)의 현재 페이지에 한정된다.
 */
export function useTicketIssueListResult({
  search,
  rows,
  totalPages,
  commit,
}: {
  readonly search: TicketIssueListView;
  readonly rows: readonly TicketIssueRow[];
  readonly totalPages: number;
  readonly commit: (next: TicketIssueListView) => void;
}) {
  const { t } = useTranslation('ticketing');
  const { locale } = useLocale();
  const selection = usePageRowSelection({ rows, getId: (row) => row.id, resetKey: JSON.stringify(search) });
  const view = listViewControls({ search, totalPages, commit });

  return {
    selection,
    view,
    columns: ticketIssueListColumns({
      t,
      locale,
      search,
      selection,
      onHeaderSort: view.sort.onHeaderSort,
    }),
  };
}
