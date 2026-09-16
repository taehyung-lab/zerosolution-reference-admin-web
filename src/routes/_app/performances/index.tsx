import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { performanceVenuesQuery } from '@/features/performances/api/queries';
import { performanceListSearch } from '@/features/performances/screens/performance-list/model/performance-list-search';
import { PerformanceListScreen } from '@/features/performances/screens/performance-list/ui/PerformanceListScreen';

/** 공연장 선택지는 진입 때 미리 데운다. 실패해도 진입을 막지 않는다 — 필드가 실패와 재시도를 스스로 보인다. */
export const Route = createFileRoute('/_app/performances/')({
  validateSearch: performanceListSearch.schema,
  beforeLoad: canonicalSearchGuard(performanceListSearch.canonical),
  loader: ({ context }) => {
    void context.queryClient.query(performanceVenuesQuery(context.locale)).catch(() => undefined);
  },
  component: PerformanceListRoute,
});

function PerformanceListRoute() {
  const navigate = Route.useNavigate();
  return (
    <PerformanceListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
      onActivate={(performanceId) => {
        void navigate({ to: '/performances/$performanceId', params: { performanceId } });
      }}
    />
  );
}
