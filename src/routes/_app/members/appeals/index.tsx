import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { appealListSearch } from '@/features/members/screens/member-appeal-list/model/appeal-list-search';
import { useAppealListRecipients } from '@/features/members/screens/member-appeal-list/model/useAppealListRecipients';
import { MemberAppealListScreen } from '@/features/members/screens/member-appeal-list/ui/MemberAppealListScreen';
import { requestMessageSend } from '@/features/messaging/screens/compose/model/message-request';
import { useMessageComposer } from '@/features/messaging/screens/compose/model/useMessageComposer';
import { MessageComposerDialog } from '@/features/messaging/screens/compose/ui/MessageComposerDialog';

export const Route = createFileRoute('/_app/members/appeals/')({
  validateSearch: appealListSearch.schema,
  beforeLoad: canonicalSearchGuard(appealListSearch.canonical),
  component: AppealsRoute,
});

function AppealsRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const messages = useMessageComposer(useAppealListRecipients(search));
  return (
    <>
      <MemberAppealListScreen
        search={search}
        onSearchChange={(next) => {
          void navigate({ search: () => next });
        }}
        onActivate={(appealId) => {
          void navigate({ to: '/members/appeals/$appealId', params: { appealId } });
        }}
        onMessage={messages.openMessage}
      />
      <MessageComposerDialog onConfirm={requestMessageSend} request={messages.message} onClose={messages.closeMessage} />
    </>
  );
}
