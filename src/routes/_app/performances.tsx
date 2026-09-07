import { requestPerformanceDetail } from '@/features/performances/list/model/performance-requests';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { PerformanceListScreen } from '@/features/performances/list/PerformanceListScreen';
import { performanceSearchSchema } from '@/features/performances/list/model/search-schema';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/performances')({
  validateSearch: performanceSearchSchema,
  beforeLoad: canonicalSearchGuard(performanceSearchSchema),
  component: PerformanceRoute,
});
function PerformanceRoute() {
  const navigate = Route.useNavigate();
  // TRANSPLANT_PENDING_PERFORMANCE_DETAIL_NAVIGATION: connect row activation when #26 has a confirmed detail route.
  return (
    <PerformanceListScreen
      onActivate={requestPerformanceDetail}
      search={Route.useSearch()}
      onSearchChange={(search) => {
        void navigate({ search: () => search });
      }}
    />
  );
}
