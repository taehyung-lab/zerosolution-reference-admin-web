import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { boardDetailQueryOptions } from '@/features/community/api/queries';
import { BoardEditScreen } from '@/features/community/screens/board-form/ui/BoardEditScreen';

export const Route = createFileRoute('/_app/community/boards/$boardId/edit')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, boardDetailQueryOptions(context.locale, params.boardId), { preload }),
  component: BoardEditRoute,
});

function BoardEditRoute() {
  const { boardId } = Route.useParams();
  const navigate = Route.useNavigate();
  const goToDetail = () => {
    void navigate({ to: '/community/boards/$boardId', params: { boardId } });
  };
  return <BoardEditScreen key={boardId} boardId={boardId} onSaved={goToDetail} onCancel={goToDetail} />;
}
