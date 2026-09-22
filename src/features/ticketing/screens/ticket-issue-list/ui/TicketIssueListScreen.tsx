import { useTranslation } from 'react-i18next';
import { ticketIssueSortKeys } from '@/features/ticketing/model/ticket-issue';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import {
  ticketIssueListSearch,
  toTicketIssueListRequest,
  type TicketIssueListSearch,
  type TicketIssueListView,
} from '../model/ticket-issue-list-search';
import { useTicketIssueListData } from '../model/useTicketIssueListData';
import { useTicketIssueListFilter } from '../model/useTicketIssueListFilter';
import { TicketIssueListActions } from './TicketIssueListActions';
import { TicketIssueListFilters } from './TicketIssueListFilters';
import { TicketIssueListResult } from './TicketIssueListResult';
import { useTicketIssueListResult } from './useTicketIssueListResult';

/**
 * 6.2 전체발권 목록(발권 > 전체발권). 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 를 넘기고 화면이 한 번 해소한다. 모든 URL 전이는 `commit` 한 곳으로
 * 나가며 canonical 로 줄여 `onSearchChange` 에 넘긴다. 검색 전(`searched` 없음)에는 조회하지 않는다.
 *
 * 행 클릭의 목적지(발권 조회, 원장 6.6)는 아직 없는 화면이라 이 작업에서 행 활성화를 잇지 않는다 —
 * 그 화면의 구성·정책은 그 화면의 fact 가 소유한다.
 */
export function TicketIssueListScreen({
  search: sparse,
  onSearchChange,
}: {
  readonly search: TicketIssueListSearch;
  readonly onSearchChange: (next: TicketIssueListSearch) => void;
}) {
  const { t } = useTranslation('ticketing');
  const search = ticketIssueListSearch.resolve(sparse);
  const commit = (next: TicketIssueListView) => onSearchChange(ticketIssueListSearch.canonical.parse(next));
  const filter = useTicketIssueListFilter(search, commit);
  const { rows, total, totalPages, counts, ...data } = useTicketIssueListData(search);
  const result = useTicketIssueListResult({ search, rows, totalPages, commit });

  return (
    <section>
      <PageHeader
        breadcrumbs={[t('issue.breadcrumb.ticketing'), t('issue.breadcrumb.issues')]}
        title={t('issue.title')}
        tooltip={{ content: t('issue.tooltip'), label: t('issue.tooltipLabel') }}
      />
      <TicketIssueListFilters filter={filter} />
      <TicketIssueListResult
        data={{ rows, ...data }}
        total={total}
        counts={counts}
        view={result.view}
        columns={result.columns}
        sortOptions={ticketIssueSortKeys.map((value) => ({ value, label: t(`issue.sort.${value}`) }))}
        actions={
          <TicketIssueListActions
            searched={search.searched}
            selectedIds={result.selection.selectedIds}
            request={toTicketIssueListRequest(search)}
            onChanged={result.selection.clear}
          />
        }
      />
    </section>
  );
}
