import { useMemberDetail } from "@/features/members/api/useMemberDetail";
import { requestMemberEdit } from "@/features/members/screens/form/model/member-form-requests";
import { MemberEditScreen } from "@/features/members/screens/form/ui/MemberEditScreen";
import { DetailStateBoundary } from "@/shared/ui/patterns/DetailStateBoundary";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/members/$memberId/edit")({
  component: MemberEditRoute,
});

function MemberEditRoute() {
  const { t: shared } = useTranslation("shared");
  const { memberId } = Route.useParams();
  const navigate = Route.useNavigate();
  const query = useMemberDetail(memberId);
  const member = query.data;
  if (member === undefined)
    return (
      <DetailStateBoundary
        state={query.state}
        labels={{
          error: shared("error.unexpected.body"),
          notFound: shared("error.notFound"),
        }}
        retryLabel={shared("error.unexpected.retry")}
        onRetry={() => {
          void query.retry();
        }}
      >
        {null}
      </DetailStateBoundary>
    );
  // TRANSPLANT_PENDING_MEMBER_EDIT_CONTRACT: confirmed request includes memberId and input; replace the reference boundary with the contracted mutation.
  return (
    <MemberEditScreen
      onConfirm={requestMemberEdit}
      key={memberId}
      memberId={memberId}
      email={member.email}
      initialValues={member.values}
      onCancel={() => {
        void navigate({ to: "/members/$memberId", params: { memberId } });
      }}
    />
  );
}
