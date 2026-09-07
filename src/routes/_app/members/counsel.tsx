import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import {
  counselSearchSchema,
  memberRecordSearchSchema,
} from "@/features/members/mechanics/record-list/model/member-record-search";
import { requestMemberCounsel } from "@/features/members/screens/counsel/model/member-counsel-requests";
import { MemberCounselScreen } from "@/features/members/screens/counsel/ui/MemberCounselScreen";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/members/counsel")({
  validateSearch: memberRecordSearchSchema,
  beforeLoad: canonicalSearchGuard(counselSearchSchema),
  component: CounselRoute,
});

function CounselRoute() {
  const navigate = Route.useNavigate();
  return (
    <MemberCounselScreen
      onRequest={requestMemberCounsel}
      search={Route.useSearch()}
      onSearchChange={(search) => {
        void navigate({ search: () => search });
      }}
    />
  );
}
