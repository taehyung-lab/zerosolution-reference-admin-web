import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { boardListSearch } from '@/features/community/screens/board-list/model/board-list-search';
import { BoardListScreen } from '@/features/community/screens/board-list/ui/BoardListScreen';

/**
 * 선택지가 전부 도메인 상수라 예열할 옵션 query 가 없고, 목록 query 는 진입 즉시 조회여도 loader 에서
 * 기다리지 않는다. URL 해소는 화면이 한 번 한다.
 */
export const Route = createFileRoute('/_app/community/boards/')({
  validateSearch: boardListSearch.schema,
  beforeLoad: canonicalSearchGuard(boardListSearch.canonical),
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
      onViewPosts={(boardId) => {
        void navigate({ to: '/community/posts', search: { boardId } });
      }}
    />
  );
}
