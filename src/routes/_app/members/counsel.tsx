import { requestMemberCounsel } from '@/features/members/counsel/member-counsel-requests';
import { createFileRoute } from "@tanstack/react-router";
import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { MemberCounselScreen } from "@/features/members/counsel/MemberCounselScreen";
import {
  counselSearchSchema,
  memberRecordSearchSchema,
} from "@/features/members/records/member-record-search";

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
