import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { boardListQueryOptions } from '@/features/community/api/queries';
import {
  boardListCanonicalSchema,
  boardListSearchContract,
  resolveBoardListSearch,
  toBoardListRequest,
} from '@/features/community/screens/board-list/model/board-list-search';
import type { BoardListSearch } from '@/features/community/screens/board-list/model/board-list-search';
import { BoardListScreen } from '@/features/community/screens/board-list/ui/BoardListScreen';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';

export const Route = createFileRoute('/_app/community/boards')({
  validateSearch: boardListSearchContract.schema,
  beforeLoad: canonicalSearchGuard(boardListCanonicalSchema),
  loaderDeps: ({ search }) => ({ search }),
  // 진입 즉시 조회 화면이라 목록 자체를 첫 페인트 전에 준비한다(원장 7행).
  loader: ({ context, deps }) =>
    context.queryClient.query(
      boardListQueryOptions(context.locale, toBoardListRequest(resolveBoardListSearch(deps.search))),
    ),
  component: BoardListRoute,
});

function BoardListRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  return (
    <BoardListScreen
      search={resolveBoardListSearch(search)}
      onSearchChange={(next: BoardListSearch) => {
        void navigate({ to: '/community/boards', search: () => next });
      }}
    />
  );
}
