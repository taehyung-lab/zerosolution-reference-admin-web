import { ManagerDetailScreen } from '@/features/managers/detail/ManagerDetailScreen';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/managers/$managerId/')({
  component: ManagerDetailRoute,
});
function ManagerDetailRoute() {
  return <ManagerDetailScreen managerId={Route.useParams().managerId} />;
}
