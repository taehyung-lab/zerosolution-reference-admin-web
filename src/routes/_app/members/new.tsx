import { MemberCreateScreen } from "@/features/members/form/MemberCreateScreen";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DevelopmentNotice } from "@/app/shell/DevelopmentNotice";

export const Route = createFileRoute("/_app/members/new")({
  component: MemberCreateRoute,
});

function MemberCreateRoute() {
  const [ready, setReady] = useState(false);
  // TRANSPLANT_PENDING_MEMBER_CREATE_CONTRACT: 신규 회원 등록 API 계약이 확정되면 확인된 입력을 연결한다.
  return (
    <>
      <DevelopmentNotice ready={ready} />
      <MemberCreateScreen onConfirm={() => setReady(true)} />
    </>
  );
}
