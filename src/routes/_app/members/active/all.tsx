import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { DevelopmentNotice } from "@/app/shell/DevelopmentNotice";
import { env } from "@/env";
import { findMemberFixture } from "@/features/members/fixtures/members";
import { AllMemberListScreen } from "@/features/members/list/MemberListScreen";
import {
  allMemberCanonicalSearchSchema,
  memberSearchSchema,
  type MemberRouteSearch,
} from "@/features/members/list/search-schema";
import { useMemberActionRequest } from "@/features/members/list/useMemberActionRequest";
import { MessageDialog } from "@/features/messaging/MessageDialog";
import { messagePolicyFixture } from "@/features/messaging/fixtures/message-policy";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_app/members/active/all")({
  validateSearch: memberSearchSchema,
  beforeLoad: canonicalSearchGuard(allMemberCanonicalSearchSchema),
  component: AllMemberListRoute,
});

function AllMemberListRoute() {
  const search = allMemberCanonicalSearchSchema.parse(Route.useSearch());
  const navigate = Route.useNavigate();
  const [ready, setReady] = useState(false);
  const actions = useMemberActionRequest({
    findMember: findMemberFixture,
    onBulkChange: () => setReady(true),
  });

  return (
    <>
      {env.VITE_REFERENCE_SCENARIOS ? (
        <DevelopmentNotice ready={ready} />
      ) : null}

      {actions.message === undefined ? null : (
        <MessageDialog
          {...actions.message}
          policy={messagePolicyFixture(actions.message.channel)}
          onClose={actions.closeMessage}
          onConfirm={() => setReady(true)}
        />
      )}
      <AllMemberListScreen
        onActionRequest={actions.onActionRequest}
        search={search}
        onSearchChange={(next: MemberRouteSearch) => {
          void navigate({ search: () => next });
        }}
        onMemberActivate={(memberId) => {
          void navigate({ to: "/members/$memberId", params: { memberId } });
        }}
        onRegister={() => {
          void navigate({ to: "/members/new" });
        }}
      />
    </>
  );
}
