import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { ticketIssueListSearch } from '@/features/ticketing/screens/ticket-issue-list/model/ticket-issue-list-search';
import { TicketIssueListScreen } from '@/features/ticketing/screens/ticket-issue-list/ui/TicketIssueListScreen';

/**
 * 검색 전 상태를 가진 목록이라 진입 URL 에서는 목록 query 를 열지 않는다. 공연·공연일 선택지는
 * 필드 안에서 조회하므로 loader 에서 예열하지 않는다. URL 해소는 화면이 한 번 한다.
 */
export const Route = createFileRoute('/_app/ticketing/issues')({
  validateSearch: ticketIssueListSearch.schema,
  beforeLoad: canonicalSearchGuard(ticketIssueListSearch.canonical),
  component: TicketIssueListRoute,
});

function TicketIssueListRoute() {
  const navigate = Route.useNavigate();
  return (
    <TicketIssueListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
    />
  );
}
