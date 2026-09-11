import { createFileRoute } from '@tanstack/react-router';
import { requestBoardEdit } from '@/features/community/screens/board-form/model/board-form-requests';
import { BoardEditScreen } from '@/features/community/screens/board-form/ui/BoardEditScreen';

export const Route = createFileRoute('/_app/community/boards/$boardId/edit')({
  component: BoardEditRoute,
});

function BoardEditRoute() {
  const { boardId } = Route.useParams();
  const navigate = Route.useNavigate();
  // TRANSPLANT_PENDING_COMMUNITY_BOARD_EDIT_INPUT: 최종 검증 입력을 업무 요청 함수까지 전달하고
  // 저장 성공은 만들지 않는다. 취소는 원문에 목적지가 없어 그 게시판의 조회 화면으로 돌아간다.
  return (
    <BoardEditScreen
      key={boardId}
      boardId={boardId}
      onConfirm={requestBoardEdit}
      onCancel={() => {
        void navigate({ to: '/community/boards/$boardId', params: { boardId } });
      }}
    />
  );
}
