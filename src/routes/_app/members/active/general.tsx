import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { GeneralMemberListScreen } from '@/features/members/list/MemberListScreen';
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
      onSearchChange={(next: MemberRouteSearch) => { void navigate({ search: () => next }); }}
      onMemberActivate={(memberId) => { void navigate({ to: '/members/$memberId', params: { memberId } }); }}
      onRegister={() => { void navigate({ to: '/members/new' }); }}
    />
  );
}
