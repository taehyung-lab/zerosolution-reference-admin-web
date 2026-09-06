import { useState } from "react";
import { findMemberFixture } from "@/features/members/fixtures/members";
import { MessageDialog } from "@/features/messaging/MessageDialog";
import { messagePolicyFixture } from "@/features/messaging/fixtures/message-policy";
import { env } from "@/env";
import { DevelopmentNotice } from "@/app/shell/DevelopmentNotice";
import { useMemberActionRequest } from "@/features/members/list/useMemberActionRequest";
import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { GeneralMemberListScreen } from "@/features/members/list/MemberListScreen";
import {
  generalMemberCanonicalSearchSchema,
  memberSearchSchema,
  type MemberRouteSearch,
} from "@/features/members/list/search-schema";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/members/active/general")({
  validateSearch: memberSearchSchema,
  beforeLoad: canonicalSearchGuard(generalMemberCanonicalSearchSchema),
  component: GeneralMemberListRoute,
});

function GeneralMemberListRoute() {
  const search = generalMemberCanonicalSearchSchema.parse(Route.useSearch());
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
      <GeneralMemberListScreen
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
