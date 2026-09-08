import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { accessSearchSchema } from "@/features/members/mechanics/record-list/model/member-record-search";
import { requestMemberAccessDownload } from "@/features/members/screens/access/model/member-access-requests";
import { MemberAccessListScreen } from "@/features/members/screens/access/ui/MemberAccessListScreen";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/members/access")({
  validateSearch: accessSearchSchema,
  beforeLoad: canonicalSearchGuard(accessSearchSchema),
  component: AccessRoute,
});
function AccessRoute() {
  const navigate = Route.useNavigate();
  // TRANSPLANT_PENDING_MEMBER_ACCESS_DOWNLOAD_CONTRACT: selected IDs or committed filters are ready; file endpoint is unknown.
  return (
    <MemberAccessListScreen
      search={Route.useSearch()}
      onSearchChange={(search) => {
        void navigate({ search: () => accessSearchSchema.parse(search) });
      }}
      onRegister={() => {
        void navigate({ to: "/members/new" });
      }}
      onDownload={requestMemberAccessDownload}
    />
  );
}
