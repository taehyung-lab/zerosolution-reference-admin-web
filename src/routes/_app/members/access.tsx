import { requestMemberAccessDownload } from '@/features/members/access/member-access-requests';
import { createFileRoute } from "@tanstack/react-router";
import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { MemberAccessListScreen } from "@/features/members/access/MemberAccessListScreen";
import {
  accessSearchSchema,
  memberRecordSearchSchema,
} from "@/features/members/records/member-record-search";
export const Route = createFileRoute("/_app/members/access")({
  // TODO(D3): this screen's own schema should validate the URL. Narrowing it makes `onSearchChange`
  // reject the wide value the shared record filter/result still produce, so those four record
  // surfaces have to become generic in the search type first. Until then the guard, not the type,
  // is what keeps a foreign field out of this screen.
  validateSearch: memberRecordSearchSchema,
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
        void navigate({ search: () => search });
      }}
      onRegister={() => {
        void navigate({ to: "/members/new" });
      }}
      onDownload={requestMemberAccessDownload}
    />
  );
}
