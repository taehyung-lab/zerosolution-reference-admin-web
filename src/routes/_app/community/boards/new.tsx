import { createFileRoute } from '@tanstack/react-router';
import { requestBoardCreate } from '@/features/community/screens/board-form/model/board-form-requests';
import { BoardCreateScreen } from '@/features/community/screens/board-form/ui/BoardCreateScreen';

/** 선택지가 도메인 상수라 예열할 옵션 query 가 없다. 그래서 loader 도 없다. */
export const Route = createFileRoute('/_app/community/boards/new')({
  component: BoardCreateRoute,
});

function BoardCreateRoute() {
  const navigate = Route.useNavigate();
  // TRANSPLANT_PENDING_COMMUNITY_BOARD_CREATE_INPUT: 최종 검증 입력을 업무 요청 함수까지 전달하고
  // 실제 저장은 서버 계약이 확정된 뒤 연결한다. 취소 목적지는 원문에 없어 목록으로 돌아간다.
  return (
    <BoardCreateScreen
      onConfirm={requestBoardCreate}
      onCancel={() => {
        void navigate({ to: '/community/boards' });
      }}
    />
  );
}
