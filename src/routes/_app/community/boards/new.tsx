import { createFileRoute } from '@tanstack/react-router';
import { BoardCreateScreen } from '@/features/community/screens/board-form/ui/BoardCreateScreen';

/** 선택지가 도메인 상수라 예열할 옵션 query 가 없다. 그래서 loader 도 없다. */
export const Route = createFileRoute('/_app/community/boards/new')({
  component: BoardCreateRoute,
});

function BoardCreateRoute() {
  const navigate = Route.useNavigate();
  const goToList = () => {
    void navigate({ to: '/community/boards' });
  };
  return <BoardCreateScreen onSaved={goToList} onCancel={goToList} />;
}
