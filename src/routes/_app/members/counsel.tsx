import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { counselInquiryOptionsQuery } from '@/features/members/api/queries';
import { counselListSearch } from '@/features/members/screens/member-counsel-list/model/counsel-list-search';
import { MemberCounselListScreen } from '@/features/members/screens/member-counsel-list/ui/MemberCounselListScreen';

/** 문의유형 옵션은 진입 때 미리 데운다. 실패해도 진입을 막지 않는다 — 필드가 실패와 재시도를 스스로 보인다. */
export const Route = createFileRoute('/_app/members/counsel')({
  validateSearch: counselListSearch.schema,
  beforeLoad: canonicalSearchGuard(counselListSearch.canonical),
  loader: ({ context }) => {
    void context.queryClient.query(counselInquiryOptionsQuery(context.locale)).catch(() => undefined);
  },
  component: CounselRoute,
});

function CounselRoute() {
  const navigate = Route.useNavigate();
  return (
    <MemberCounselListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
    />
  );
}
