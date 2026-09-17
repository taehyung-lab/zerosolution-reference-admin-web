import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { performanceVenuesQuery } from '@/features/performances/api/queries';
import { contentListSearch } from '@/features/performances/screens/performance-content-list/model/content-list-search';
import { PerformanceContentListScreen } from '@/features/performances/screens/performance-content-list/ui/PerformanceContentListScreen';

/** 공연장 선택지는 진입 때 미리 데운다. 실패해도 진입을 막지 않는다 — 필드가 실패와 재시도를 스스로 보인다. */
export const Route = createFileRoute('/_app/performances/contents')({
  validateSearch: contentListSearch.schema,
  beforeLoad: canonicalSearchGuard(contentListSearch.canonical),
  loader: ({ context }) => {
    void context.queryClient.query(performanceVenuesQuery(context.locale)).catch(() => undefined);
  },
  component: ContentListRoute,
});

function ContentListRoute() {
  const navigate = Route.useNavigate();
  return (
    <PerformanceContentListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
    />
  );
}
