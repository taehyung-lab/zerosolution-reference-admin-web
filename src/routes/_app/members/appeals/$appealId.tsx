import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { appealDetailQueryOptions } from '@/features/members/api/queries';
import { useAppealDetail } from '@/features/members/api/useAppealDetail';
import { AppealDetailScreen } from '@/features/members/screens/member-appeal-detail/ui/AppealDetailScreen';
import { requestMessageSend } from '@/features/messaging/screens/compose/model/message-request';
import { useMessageComposer } from '@/features/messaging/screens/compose/model/useMessageComposer';
import { MessageComposerDialog } from '@/features/messaging/screens/compose/ui/MessageComposerDialog';

export const Route = createFileRoute('/_app/members/appeals/$appealId')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, appealDetailQueryOptions(context.locale, params.appealId), { preload }),
  component: AppealRoute,
});

/** 회원정보 조회 링크의 경로와 SMS·이메일 작성은 route 가 소유한다. 수신자는 현재 상세 데이터에서 다시 읽는다. */
function AppealRoute() {
  const { appealId } = Route.useParams();
  const detail = useAppealDetail(appealId);
  const messages = useMessageComposer<string>((channel) =>
    detail.data ? [{ address: channel === 'sms' ? detail.data.phone : detail.data.email, name: detail.data.name }] : [],
  );
  return (
    <>
      <AppealDetailScreen
        key={appealId}
        appealId={appealId}
        memberHref={(memberId) => `/members/${memberId}`}
        onMessage={(channel) => messages.openMessage(channel, appealId)}
      />
      <MessageComposerDialog onConfirm={requestMessageSend} request={messages.message} onClose={messages.closeMessage} />
    </>
  );
}
