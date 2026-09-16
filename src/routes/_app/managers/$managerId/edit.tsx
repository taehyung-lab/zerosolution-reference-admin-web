import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { managerDetailQueryOptions } from '@/features/managers/api/queries';
import { ManagerEditScreen } from '@/features/managers/screens/manager-form/ui/ManagerEditScreen';

export const Route = createFileRoute('/_app/managers/$managerId/edit')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, managerDetailQueryOptions(context.locale, params.managerId), { preload }),
  component: ManagerEditRoute,
});

function ManagerEditRoute() {
  const { managerId } = Route.useParams();
  const navigate = Route.useNavigate();
  const goToDetail = () => {
    void navigate({ to: '/managers/$managerId', params: { managerId } });
  };
  return <ManagerEditScreen key={managerId} managerId={managerId} onSaved={goToDetail} onCancel={goToDetail} />;
}
