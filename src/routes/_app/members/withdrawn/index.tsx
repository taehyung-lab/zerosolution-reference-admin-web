import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { withdrawnListSearch } from '@/features/members/screens/member-withdrawn-list/model/withdrawn-list-search';
import { WithdrawnMemberListScreen } from '@/features/members/screens/member-withdrawn-list/ui/WithdrawnMemberListScreen';

export const Route = createFileRoute('/_app/members/withdrawn/')({
  validateSearch: withdrawnListSearch.schema,
  beforeLoad: canonicalSearchGuard(withdrawnListSearch.canonical),
  component: WithdrawnRoute,
});

function WithdrawnRoute() {
  const navigate = Route.useNavigate();
  return (
    <WithdrawnMemberListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
      onActivate={(memberId) => {
        void navigate({ to: '/members/withdrawn/$memberId', params: { memberId } });
      }}
      onCreate={() => {
        void navigate({ to: '/members/new' });
      }}
    />
  );
}
