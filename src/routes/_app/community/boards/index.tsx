import { createFileRoute } from '@tanstack/react-router';
import {
  boardListCanonicalSchema,
  boardListSearchContract,
} from '@/features/community/screens/board-list/model/board-list-search';
import { BoardListScreen } from '@/features/community/screens/board-list/ui/BoardListScreen';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';

/**
 * 이 화면에는 선택지 query 가 없으므로 loader 도 없다. 목록 query 는 진입 즉시 조회여도
 * loader 에서 기다리지 않는다(router.md 형태). 해소는 화면이 한 번 한다.
 */
export const Route = createFileRoute('/_app/community/boards/')({
  validateSearch: boardListSearchContract.schema,
  beforeLoad: canonicalSearchGuard(boardListCanonicalSchema),
  component: BoardListRoute,
});

function BoardListRoute() {
  const navigate = Route.useNavigate();
  return (
    <BoardListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
      onActivate={(boardId) => {
        void navigate({ to: '/community/boards/$boardId', params: { boardId } });
      }}
      onCreate={() => {
        void navigate({ to: '/community/boards/new' });
      }}
    />
  );
}
