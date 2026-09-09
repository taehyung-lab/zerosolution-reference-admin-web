import { canonicalSearchGuard } from "@/app/router/canonical-search-guard";
import { performanceVenuesQuery } from "@/features/performances/api/queries";
import { performanceSearchSchema } from "@/features/performances/screens/list/model/search-schema";
import { PerformanceListScreen } from "@/features/performances/screens/list/ui/PerformanceListScreen";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/performances/")({
  validateSearch: performanceSearchSchema,
  beforeLoad: canonicalSearchGuard(performanceSearchSchema),
  loader: ({ context }) => {
    void context.queryClient
      .query(performanceVenuesQuery(context.locale))
      .catch(() => undefined);
  },
  component: PerformanceRoute,
});
function PerformanceRoute() {
  const navigate = Route.useNavigate();
  return (
    <PerformanceListScreen
      onActivate={(performanceId) => {
        void navigate({
          to: "/performances/$performanceId",
          params: { performanceId },
        });
      }}
      search={Route.useSearch()}
      onSearchChange={(search) => {
        void navigate({ search: () => search });
      }}
    />
  );
}
