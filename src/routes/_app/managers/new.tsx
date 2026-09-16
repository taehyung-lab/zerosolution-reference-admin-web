import { createFileRoute } from '@tanstack/react-router';
import { ManagerCreateScreen } from '@/features/managers/screens/manager-form/ui/ManagerCreateScreen';

/** 옵션 query 는 폼 필드가 스스로 열고 실패를 필드 안에서 보인다. 그래서 loader 도 없다. */
export const Route = createFileRoute('/_app/managers/new')({
  component: ManagerCreateRoute,
});

function ManagerCreateRoute() {
  const navigate = Route.useNavigate();
  const goToList = () => {
    void navigate({ to: '/managers' });
  };
  return <ManagerCreateScreen onSaved={goToList} onCancel={goToList} />;
}
