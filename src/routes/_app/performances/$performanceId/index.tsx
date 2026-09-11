import { requestPerformanceEdit } from "@/features/performances/screens/detail/model/performance-detail-requests";
import { PerformanceDetailScreen } from "@/features/performances/screens/detail/ui/PerformanceDetailScreen";
import { loadRequired } from "@/app/router/required-loader";
import { performanceDetailQuery } from "@/features/performances/api/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/performances/$performanceId/")({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, performanceDetailQuery(context.locale, params.performanceId), { preload }),
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
