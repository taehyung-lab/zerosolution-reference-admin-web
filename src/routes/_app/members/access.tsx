import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { accessListSearch } from '@/features/members/screens/member-access-list/model/access-list-search';
import { MemberAccessListScreen } from '@/features/members/screens/member-access-list/ui/MemberAccessListScreen';

export const Route = createFileRoute('/_app/members/access')({
  validateSearch: accessListSearch.schema,
  beforeLoad: canonicalSearchGuard(accessListSearch.canonical),
  component: AccessRoute,
});

function AccessRoute() {
  const navigate = Route.useNavigate();
  return (
    <MemberAccessListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
      onCreate={() => {
        void navigate({ to: '/members/new' });
      }}
    />
  );
}
