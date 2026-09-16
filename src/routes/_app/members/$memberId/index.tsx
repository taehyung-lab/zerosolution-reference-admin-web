import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { memberDetailQueryOptions } from '@/features/members/api/queries';
import { useMemberDetail } from '@/features/members/api/useMemberDetail';
import { MemberDetailScreen } from '@/features/members/screens/member-detail/ui/MemberDetailScreen';
import { requestMessageSend } from '@/features/messaging/screens/compose/model/message-request';
import { useMessageComposer } from '@/features/messaging/screens/compose/model/useMessageComposer';
import { MessageComposerDialog } from '@/features/messaging/screens/compose/ui/MessageComposerDialog';

export const Route = createFileRoute('/_app/members/$memberId/')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, memberDetailQueryOptions(context.locale, params.memberId), { preload }),
  component: MemberDetailRoute,
});

/** SMS·이메일 작성은 다른 도메인(messaging)의 기능이라 route 가 조립한다. 수신자는 현재 상세 데이터에서 다시 읽는다. */
function MemberDetailRoute() {
  const { memberId } = Route.useParams();
  const navigate = Route.useNavigate();
  const detail = useMemberDetail(memberId);
  const messages = useMessageComposer<string>((channel) =>
    detail.data ? [{ address: channel === 'sms' ? detail.data.phone : detail.data.email, name: detail.data.name }] : [],
  );
  return (
    <>
      <MemberDetailScreen
        key={memberId}
        memberId={memberId}
        onEdit={(id) => {
          void navigate({ to: '/members/$memberId/edit', params: { memberId: id } });
        }}
        onMessage={(channel) => messages.openMessage(channel, memberId)}
      />
      <MessageComposerDialog onConfirm={requestMessageSend} request={messages.message} onClose={messages.closeMessage} />
    </>
  );
}
