import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env";
import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { DevelopmentNotice } from "@/app/shell/DevelopmentNotice";
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
  const [ready, setReady] = useState(false);
  return (
    <>
      {env.VITE_REFERENCE_SCENARIOS ? (
        <DevelopmentNotice ready={ready} />
      ) : null}
      <MemberCounselScreen
        search={Route.useSearch()}
        onSearchChange={(search) => {
          void navigate({ search: () => search });
        }}
        onRequest={() => setReady(true)}
      />
    </>
  );
}
