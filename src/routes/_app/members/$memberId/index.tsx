import { MessageDialog } from "@/features/messaging/MessageDialog";
import { messagePolicyFixture } from "@/features/messaging/fixtures/message-policy";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { env } from "@/env";
import { MemberDetailScreen } from "@/features/members/detail/MemberDetailScreen";
import {
  findMemberFixture,
  selectMemberActivityFixture,
  memberCounselFixtures,
} from "@/features/members/fixtures/members";
import { DevelopmentNotice } from "@/app/shell/DevelopmentNotice";
import { useMemberActionRequest } from "@/features/members/list/useMemberActionRequest";
import type { MemberActivitySearch } from "@/features/members/detail/activity/MemberActivitySection";

export const Route = createFileRoute("/_app/members/$memberId/")({
  component: MemberDetailRoute,
});

function MemberDetailRoute() {
  const { t } = useTranslation("members");
  const { memberId } = Route.useParams();
  const navigate = Route.useNavigate();
  const [ready, setReady] = useState(false);
  const [activityQuery, setActivityQuery] = useState<MemberActivitySearch>({
    tab: "ticket",
    keyword: "",
    page: 1,
    pageSize: 100,
  });
  const actions = useMemberActionRequest({
    findMember: findMemberFixture,
    onBulkChange: () => setReady(true),
  });
  if (!env.VITE_REFERENCE_SCENARIOS)
    return (
      <>
        <PageHeader title={t("detail.title")} />
        <p>{t("detail.contractPending")}</p>
      </>
    );
  const member = findMemberFixture(memberId);
  if (member === undefined) return notFound({ throw: true });
  const activity = selectMemberActivityFixture(memberId, activityQuery);
  // TRANSPLANT_PENDING_MEMBER_DETAIL_CONTRACT: callbacks stop at validated request input; no fake persistence or authentication.
  return (
    <>
      <DevelopmentNotice ready={ready} />
      {actions.message === undefined ? null : (
        <MessageDialog
          {...actions.message}
          policy={messagePolicyFixture(actions.message.channel)}
          onClose={actions.closeMessage}
          onConfirm={() => setReady(true)}
        />
      )}
      <MemberDetailScreen
        key={memberId}
        member={member}
        activity={activity}
        activityQuery={activityQuery}
        onActivitySearch={setActivityQuery}
        counsel={memberCounselFixtures}
        history={[]}
        operatorName="REFERENCE"
        onEdit={() => {
          void navigate({
            to: "/members/$memberId/edit",
            params: { memberId },
          });
        }}
        onMessage={(type) =>
          actions.onActionRequest({ type, targetIds: [memberId] })
        }
        onRequest={() => setReady(true)}
      />
    </>
  );
}
