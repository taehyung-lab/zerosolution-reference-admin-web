import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { memberListDefinitions } from '@/features/members/screens/member-list/model/member-list-definition';
import { memberListSearch } from '@/features/members/screens/member-list/model/member-list-search';
import { useMemberListRecipients } from '@/features/members/screens/member-list/model/useMemberListRecipients';
import { MemberListScreen } from '@/features/members/screens/member-list/ui/MemberListScreen';
import { requestMessageSend } from '@/features/messaging/screens/compose/model/message-request';
import { useMessageComposer } from '@/features/messaging/screens/compose/model/useMessageComposer';
import { MessageComposerDialog } from '@/features/messaging/screens/compose/ui/MessageComposerDialog';

const definition = memberListDefinitions.general;

export const Route = createFileRoute('/_app/members/active/general')({
  validateSearch: memberListSearch.schema,
  beforeLoad: canonicalSearchGuard(memberListSearch.canonical),
  component: GeneralMemberListRoute,
});

function GeneralMemberListRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const messages = useMessageComposer(useMemberListRecipients(search, definition));
  return (
    <>
      <MemberListScreen
        definition={definition}
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
