import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { termsListSearch } from '@/features/terms/screens/terms-list/model/terms-list-search';
import { TermsListScreen } from '@/features/terms/screens/terms-list/ui/TermsListScreen';

/**
 * 11.2 약관 목록. 목록 query 는 진입 즉시 조회여도 loader 에서 기다리지 않는다. 검색 영역의 선택지가
 * 전부 도메인 enum 이라 예열할 선택지 query 도 없다. URL 해소는 화면이 한 번 한다.
 */
export const Route = createFileRoute('/_app/terms/')({
  validateSearch: termsListSearch.schema,
  beforeLoad: canonicalSearchGuard(termsListSearch.canonical),
  component: TermsListRoute,
});

function TermsListRoute() {
  const navigate = Route.useNavigate();
  return (
    <TermsListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
      onActivate={(termsId) => {
        void navigate({ to: '/terms/$termsId', params: { termsId } });
      }}
      onCreate={() => {
        void navigate({ to: '/terms/new' });
      }}
    />
  );
}
