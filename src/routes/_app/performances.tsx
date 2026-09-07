import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { requestPerformanceDetail } from "@/features/performances/screens/list/model/performance-requests";
import { performanceSearchSchema } from "@/features/performances/screens/list/model/search-schema";
import { PerformanceListScreen } from "@/features/performances/screens/list/ui/PerformanceListScreen";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/performances")({
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
