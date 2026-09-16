import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { boardDetailQueryOptions } from '@/features/community/api/queries';
import { BoardDetailScreen } from '@/features/community/screens/board-detail/ui/BoardDetailScreen';

export const Route = createFileRoute('/_app/community/boards/$boardId/')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, boardDetailQueryOptions(context.locale, params.boardId), { preload }),
  component: BoardDetailRoute,
});

function BoardDetailRoute() {
  const { boardId } = Route.useParams();
  const navigate = Route.useNavigate();
  return (
    <BoardDetailScreen
      key={boardId}
      boardId={boardId}
      onEdit={(id) => {
        void navigate({ to: '/community/boards/$boardId/edit', params: { boardId: id } });
      }}
      onDeleted={() => {
        void navigate({ to: '/community/boards' });
      }}
    />
  );
}
