import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { env } from "@/env";
import { MemberEditScreen } from "@/features/members/form/MemberEditScreen";
import { findMemberFixture } from "@/features/members/fixtures/members";
import { DevelopmentNotice } from "@/app/shell/DevelopmentNotice";

export const Route = createFileRoute("/_app/members/$memberId/edit")({
  component: MemberEditRoute,
});

function MemberEditRoute() {
  const { memberId } = Route.useParams();
  const navigate = Route.useNavigate();
  const { t } = useTranslation("members");
  const [ready, setReady] = useState(false);
  if (!env.VITE_REFERENCE_SCENARIOS)
    return <p>{t("detail.contractPending")}</p>;
  const member = findMemberFixture(memberId);
  if (member === undefined) return notFound({ throw: true });
  // TRANSPLANT_PENDING_MEMBER_EDIT_CONTRACT: confirmed request includes memberId and input; replace the reference boundary with the contracted mutation.
  return (
    <>
      <DevelopmentNotice ready={ready} />
      <MemberEditScreen
        key={memberId}
        memberId={memberId}
        email={member.email}
        initialValues={member.values}
        onConfirm={() => setReady(true)}
        onCancel={() => {
          void navigate({ to: "/members/$memberId", params: { memberId } });
        }}
      />
    </>
  );
}
