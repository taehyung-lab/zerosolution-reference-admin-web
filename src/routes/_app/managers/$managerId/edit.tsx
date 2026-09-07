import { requestManagerEdit } from '@/features/managers/form/manager-form-requests';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { DetailStateBoundary } from '@/shared/ui/patterns/DetailStateBoundary';
import { useManagerDirectoryDetail } from '@/features/managers/detail/useManagerDirectoryDetail';
import { ManagerEditInputScreen } from '@/features/managers/form/ManagerInputScreens';
import { toManagerEditDefaults } from '@/features/managers/form/manager-form-defaults';
export const Route = createFileRoute('/_app/managers/$managerId/edit')({ component: ManagerEditRoute });
function ManagerEditRoute() {
  const { managerId } = Route.useParams();
  const { t } = useTranslation('managers');
  const query = useManagerDirectoryDetail(managerId);
  if (!query.data) return <DetailStateBoundary state={query.state} labels={{ error: t('detail.error'), notFound: t('detail.notFound') }} retryLabel={t('result.retry')} onRetry={() => { void query.retry(); }}>{null}</DetailStateBoundary>;
  // TRANSPLANT_PENDING_MANAGER_EDIT_INPUT: 최종 입력 확인은 업무 요청 함수까지 전달하며 저장 성공은 만들지 않는다.
  return <ManagerEditInputScreen key={managerId} onConfirm={requestManagerEdit} managerId={managerId} defaults={toManagerEditDefaults(query.data.detail)} />;
}
