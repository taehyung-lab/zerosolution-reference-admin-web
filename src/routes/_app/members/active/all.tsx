import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { AllMemberListScreen } from '@/features/members/list/MemberListScreens';
import { allMemberCanonicalSearchSchema, memberSearchSchema, type MemberRouteSearch } from '@/features/members/list/search-schema';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/members/active/all')({
  validateSearch: memberSearchSchema,
  beforeLoad: canonicalSearchGuard(allMemberCanonicalSearchSchema),
  component: AllMemberListRoute,
});

function AllMemberListRoute() {
  const search = allMemberCanonicalSearchSchema.parse(Route.useSearch());
  const navigate = Route.useNavigate();
  return (
    <AllMemberListScreen
      search={search}
      data={{ rows: [], total: 0, totalPages: 1 }}
      onSearchChange={(next: MemberRouteSearch) => { void navigate({ search: () => next }); }}
      onActionIntent={() => undefined}
      onMemberActivate={(memberId) => { void navigate({ to: '/members/$memberId', params: { memberId } }); }}
      onRegister={() => { void navigate({ to: '/members/new' }); }}
    />
  );
}
