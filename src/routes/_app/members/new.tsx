import { requestMemberCreate } from '@/features/members/form/member-form-requests';
import { MemberCreateScreen } from "@/features/members/form/MemberCreateScreen";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/members/new")({
  component: MemberCreateRoute,
});

function MemberCreateRoute() {
  // TRANSPLANT_PENDING_MEMBER_CREATE_CONTRACT: 신규 회원 등록 API 계약이 확정되면 확인된 입력을 연결한다.
  return <MemberCreateScreen onConfirm={requestMemberCreate} />;
}
