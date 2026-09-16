import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { managerDetailQueryOptions } from '@/features/managers/api/queries';
import { useManagerDetail } from '@/features/managers/api/useManagerDetail';
import { ManagerDetailScreen } from '@/features/managers/screens/manager-detail/ui/ManagerDetailScreen';
import { requestMessageSend } from '@/features/messaging/screens/compose/model/message-request';
import { useMessageComposer } from '@/features/messaging/screens/compose/model/useMessageComposer';
import { MessageComposerDialog } from '@/features/messaging/screens/compose/ui/MessageComposerDialog';

export const Route = createFileRoute('/_app/managers/$managerId/')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, managerDetailQueryOptions(context.locale, params.managerId), { preload }),
  component: ManagerDetailRoute,
});

/** SMS·이메일 작성은 다른 도메인(messaging)의 기능이라 route 가 조립한다. 수신자는 현재 상세 데이터에서 다시 읽는다. */
function ManagerDetailRoute() {
  const { managerId } = Route.useParams();
  const navigate = Route.useNavigate();
  const detail = useManagerDetail(managerId);
  const messages = useMessageComposer<string>((channel) =>
    detail.data
      ? [{ address: channel === 'sms' ? detail.data.phone : detail.data.email, name: detail.data.name }]
      : [],
  );
  return (
    <>
      <ManagerDetailScreen
        key={managerId}
        managerId={managerId}
        onEdit={(id) => {
          void navigate({ to: '/managers/$managerId/edit', params: { managerId: id } });
        }}
        onMessage={(channel) => messages.openMessage(channel, managerId)}
      />
      <MessageComposerDialog onConfirm={requestMessageSend} request={messages.message} onClose={messages.closeMessage} />
    </>
  );
}
