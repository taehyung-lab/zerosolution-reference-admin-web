import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { GeneralMemberListScreen } from '@/features/members/list/MemberListScreens';
import { generalMemberCanonicalSearchSchema, memberSearchSchema, type MemberRouteSearch } from '@/features/members/list/search-schema';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/members/active/general')({
  validateSearch: memberSearchSchema,
  beforeLoad: canonicalSearchGuard(generalMemberCanonicalSearchSchema),
  component: GeneralMemberListRoute,
});

function GeneralMemberListRoute() {
  const search = generalMemberCanonicalSearchSchema.parse(Route.useSearch());
  const navigate = Route.useNavigate();
  return (
    <GeneralMemberListScreen
      search={search}
      data={{ rows: [], total: 0, totalPages: 1 }}
      onSearchChange={(next: MemberRouteSearch) => { void navigate({ search: () => next }); }}
      onActionIntent={() => undefined}
      onMemberActivate={(memberId) => { void navigate({ to: '/members/$memberId', params: { memberId } }); }}
      onRegister={() => { void navigate({ to: '/members/new' }); }}
    />
  );
}
