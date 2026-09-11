import { useMemberActivity } from "@/features/members/api/useMemberActivity";
import { useMemberCounselRecords } from "@/features/members/api/useMemberCounselRecords";
import {
  memberMessageRecipients,
  memberProfileContact,
} from "@/features/members/model/member-message";
import { requestMemberDetail } from "@/features/members/screens/detail/model/member-detail-requests";
import { useMemberDetail } from "@/features/members/api/useMemberDetail";
import { MemberDetailScreen } from "@/features/members/screens/detail/ui/MemberDetailScreen";
import { requestMessageSend } from "@/features/messaging/screens/compose/model/message-request";
import { useMessageComposer } from "@/features/messaging/screens/compose/model/useMessageComposer";
import { MessageComposerDialog } from "@/features/messaging/screens/compose/ui/MessageComposerDialog";
import { DetailStateBoundary } from "@/shared/ui/patterns/DetailStateBoundary";
import { loadRequired } from "@/app/router/required-loader";
import { memberDetailQuery } from "@/features/members/api/detail-queries";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MemberActivitySearch } from "../../../../features/members/model/member-activity";

export const Route = createFileRoute("/_app/members/$memberId/")({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, memberDetailQuery(context.locale, params.memberId), { preload }),
  component: MemberDetailRoute,
});

function MemberDetailRoute() {
  const { t: shared } = useTranslation("shared");
  const { memberId } = Route.useParams();
  const navigate = Route.useNavigate();
  const [activityQuery, setActivityQuery] = useState<MemberActivitySearch>({
    tab: "ticket",
    keyword: "",
    page: 1,
    pageSize: 100,
  });
  const query = useMemberDetail(memberId);
  const member = query.data;
  const activity = useMemberActivity(memberId, activityQuery);
  const counsel = useMemberCounselRecords(memberId);
  // 발송 주소는 상세가 이미 조회한 회원 사실에서 온다. 목록 셀의 마스킹 값을 되돌리지 않는다.
  const actions = useMessageComposer((channel, ids: readonly string[]) =>
    memberMessageRecipients(
      member === undefined ? [] : [memberProfileContact(member)],
      channel,
      ids,
    ),
  );
  if (member === undefined)
    return (
      <DetailStateBoundary
        state={query.state}
        labels={{
          error: shared("error.unexpected.body"),
          notFound: shared("error.kind.notFound"),
        }}
        retryLabel={shared("error.unexpected.retry")}
        onRetry={() => {
          void query.retry();
        }}
      >
        {null}
      </DetailStateBoundary>
    );
  // TRANSPLANT_PENDING_MEMBER_DETAIL_CONTRACT: callbacks stop at validated request input; no fake persistence or authentication.
  return (
    <>
      <MessageComposerDialog
        onConfirm={requestMessageSend}
        request={actions.message}
        onClose={actions.closeMessage}
      />
      <MemberDetailScreen
        onRequest={requestMemberDetail}
        key={memberId}
        member={member}
        activity={activity}
        activityQuery={activityQuery}
        onActivitySearch={setActivityQuery}
        counsel={counsel}
        history={[]}
        operatorName="REFERENCE"
        onEdit={() => {
          void navigate({
            to: "/members/$memberId/edit",
            params: { memberId },
          });
        }}
        onMessage={(type) => actions.openMessage(type, [memberId])}
      />
    </>
  );
}
