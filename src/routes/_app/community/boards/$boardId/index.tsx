import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { boardDetailQueryOptions } from '@/features/community/api/queries';
import { requestBoardDelete } from '@/features/community/screens/board-detail/model/board-detail-requests';
import { BoardDetailScreen } from '@/features/community/screens/board-detail/ui/BoardDetailScreen';

export const Route = createFileRoute('/_app/community/boards/$boardId/')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, boardDetailQueryOptions(context.locale, params.boardId), { preload }),
  component: BoardDetailRoute,
});

function BoardDetailRoute() {
  const { boardId } = Route.useParams();
  const navigate = Route.useNavigate();
  // TRANSPLANT_PENDING_COMMUNITY_BOARD_DELETE_INPUT: 확인까지 통과한 삭제 의도를 업무 요청 함수로
  // 넘기며 서버 삭제·완료 alert·목록 복귀는 계약 확정 후 연결한다.
  return (
    <BoardDetailScreen
      key={boardId}
      boardId={boardId}
      onEdit={(id) => {
        void navigate({ to: '/community/boards/$boardId/edit', params: { boardId: id } });
      }}
      onDelete={requestBoardDelete}
    />
  );
}
