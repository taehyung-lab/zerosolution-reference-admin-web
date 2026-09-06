import { createFileRoute } from "@tanstack/react-router";
import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { WithdrawnMemberListScreen } from "@/features/members/withdrawn/WithdrawnMemberListScreen";
import {
  withdrawnSearchSchema,
  memberRecordSearchSchema,
} from "@/features/members/records/member-record-search";
export const Route = createFileRoute("/_app/members/withdrawn/")({
  validateSearch: memberRecordSearchSchema,
  beforeLoad: canonicalSearchGuard(withdrawnSearchSchema),
  component: WithdrawnRoute,
});
function WithdrawnRoute() {
  const navigate = Route.useNavigate();
  return (
    <WithdrawnMemberListScreen
      search={Route.useSearch()}
      onSearchChange={(search) => {
        void navigate({ search: () => search });
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
