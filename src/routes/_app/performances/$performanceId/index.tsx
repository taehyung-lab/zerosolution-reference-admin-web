import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { performanceDetailQueryOptions } from '@/features/performances/api/queries';
import { PerformanceDetailScreen } from '@/features/performances/screens/performance-detail/ui/PerformanceDetailScreen';

export const Route = createFileRoute('/_app/performances/$performanceId/')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, performanceDetailQueryOptions(context.locale, params.performanceId), {
      preload,
    }),
  component: PerformanceDetailRoute,
});

function PerformanceDetailRoute() {
  const { performanceId } = Route.useParams();
  const navigate = Route.useNavigate();
  return (
    <PerformanceDetailScreen
      key={performanceId}
      performanceId={performanceId}
      onEdit={(id) => {
        void navigate({ to: '/performances/$performanceId/edit', params: { performanceId: id } });
      }}
    />
  );
}
