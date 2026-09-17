import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { performanceDetailQueryOptions } from '@/features/performances/api/queries';
import { PerformanceAdmissionEditScreen } from '@/features/performances/screens/performance-admission-form/ui/PerformanceAdmissionEditScreen';

export const Route = createFileRoute('/_app/performances/$performanceId/edit')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, performanceDetailQueryOptions(context.locale, params.performanceId), {
      preload,
    }),
  component: PerformanceAdmissionEditRoute,
});

/** 저장 완료와 취소는 모두 그 공연의 조회로 돌아간다(원문 「입장안내정보를 수정할 수 있다」). */
function PerformanceAdmissionEditRoute() {
  const { performanceId } = Route.useParams();
  const navigate = Route.useNavigate();
  const goToDetail = () => {
    void navigate({ to: '/performances/$performanceId', params: { performanceId } });
  };
  return (
    <PerformanceAdmissionEditScreen
      key={performanceId}
      performanceId={performanceId}
      onSaved={goToDetail}
      onCancel={goToDetail}
    />
  );
}
