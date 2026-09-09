import { requestPerformanceEdit } from "@/features/performances/screens/detail/model/performance-detail-requests";
import { PerformanceDetailScreen } from "@/features/performances/screens/detail/ui/PerformanceDetailScreen";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/performances/$performanceId/")({
  component: PerformanceDetailRoute,
});

function PerformanceDetailRoute() {
  return (
    <PerformanceDetailScreen
      performanceId={Route.useParams().performanceId}
      onEdit={requestPerformanceEdit}
    />
  );
}
