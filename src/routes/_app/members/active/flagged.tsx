import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { FlaggedMemberListScreen } from '@/features/members/list/MemberListScreen';
import { flaggedMemberCanonicalSearchSchema, memberSearchSchema, type MemberRouteSearch } from '@/features/members/list/search-schema';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/members/active/flagged')({
  validateSearch: memberSearchSchema,
  beforeLoad: canonicalSearchGuard(flaggedMemberCanonicalSearchSchema),
  component: FlaggedMemberListRoute,
});

function FlaggedMemberListRoute() {
  const search = flaggedMemberCanonicalSearchSchema.parse(Route.useSearch());
  const navigate = Route.useNavigate();
  return (
    <FlaggedMemberListScreen
      search={search}
      onSearchChange={(next: MemberRouteSearch) => { void navigate({ search: () => next }); }}
      onMemberActivate={(memberId) => { void navigate({ to: '/members/$memberId', params: { memberId } }); }}
      onRegister={() => { void navigate({ to: '/members/new' }); }}
    />
  );
}
