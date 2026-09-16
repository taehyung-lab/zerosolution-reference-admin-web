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
  return (
    <PerformanceDetailScreen
      key={performanceId}
      performanceId={performanceId}
      onEdit={(id) => {
        // TRANSPLANT_PENDING_PERFORMANCE_EDIT_POLICY: 입장안내 편집 화면은 파일 제한·입력방식 전환 정책이
        // 미확인이라 아직 없다. 목적지가 확정되면 여기서 그 route 로 이동한다.
        console.log(`[시나리오] 공연 입장안내 편집 ${id}: 대상 확인 → 미확정 입력 정책 대기`);
      }}
    />
  );
}
