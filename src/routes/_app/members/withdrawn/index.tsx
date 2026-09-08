import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { withdrawnSearchSchema } from "@/features/members/mechanics/record-list/model/member-record-search";
import { WithdrawnMemberListScreen } from "@/features/members/screens/withdrawn/ui/WithdrawnMemberListScreen";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/members/withdrawn/")({
  validateSearch: withdrawnSearchSchema,
  beforeLoad: canonicalSearchGuard(withdrawnSearchSchema),
  component: WithdrawnRoute,
});
function WithdrawnRoute() {
  const navigate = Route.useNavigate();
  return (
    <WithdrawnMemberListScreen
      search={Route.useSearch()}
      onSearchChange={(search) => {
        void navigate({ search: () => withdrawnSearchSchema.parse(search) });
      }}
      onActivate={(memberId) => {
        void navigate({
          to: "/members/withdrawn/$memberId",
          params: { memberId },
        });
      }}
      onRegister={() => {
        void navigate({ to: "/members/new" });
      }}
    />
  );
}
