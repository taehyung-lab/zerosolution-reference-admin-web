import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { dormantListSearch } from '@/features/members/screens/member-dormant-list/model/dormant-list-search';
import { useDormantListRecipients } from '@/features/members/screens/member-dormant-list/model/useDormantListRecipients';
import { DormantMemberListScreen } from '@/features/members/screens/member-dormant-list/ui/DormantMemberListScreen';
import { requestMessageSend } from '@/features/messaging/screens/compose/model/message-request';
import { useMessageComposer } from '@/features/messaging/screens/compose/model/useMessageComposer';
import { MessageComposerDialog } from '@/features/messaging/screens/compose/ui/MessageComposerDialog';

export const Route = createFileRoute('/_app/members/dormant')({
  validateSearch: dormantListSearch.schema,
  beforeLoad: canonicalSearchGuard(dormantListSearch.canonical),
  component: DormantRoute,
});

function DormantRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const messages = useMessageComposer(useDormantListRecipients(search));
  return (
    <>
      <DormantMemberListScreen
        search={search}
        onSearchChange={(next) => {
          void navigate({ search: () => next });
        }}
        onActivate={(memberId) => {
          void navigate({ to: '/members/$memberId', params: { memberId } });
        }}
        onCreate={() => {
          void navigate({ to: '/members/new' });
        }}
        onMessage={messages.openMessage}
      />
      <MessageComposerDialog onConfirm={requestMessageSend} request={messages.message} onClose={messages.closeMessage} />
    </>
  );
}
