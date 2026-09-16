import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { memberListDefinitions } from '@/features/members/screens/member-list/model/member-list-definition';
import { memberListSearch } from '@/features/members/screens/member-list/model/member-list-search';
import { useMemberListRecipients } from '@/features/members/screens/member-list/model/useMemberListRecipients';
import { MemberListScreen } from '@/features/members/screens/member-list/ui/MemberListScreen';
import { requestMessageSend } from '@/features/messaging/screens/compose/model/message-request';
import { useMessageComposer } from '@/features/messaging/screens/compose/model/useMessageComposer';
import { MessageComposerDialog } from '@/features/messaging/screens/compose/ui/MessageComposerDialog';

const definition = memberListDefinitions.all;

/** 검색 전 상태를 가진 목록이라 진입 URL 에서는 목록 query 를 열지 않는다. URL 해소는 화면이 한 번 한다. */
export const Route = createFileRoute('/_app/members/active/all')({
  validateSearch: memberListSearch.schema,
  beforeLoad: canonicalSearchGuard(memberListSearch.canonical),
  component: AllMemberListRoute,
});

/** SMS·이메일 작성은 다른 도메인(messaging)의 기능이라 route 가 조립한다. 수신자는 목록 캐시에서 다시 읽는다. */
function AllMemberListRoute() {
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
