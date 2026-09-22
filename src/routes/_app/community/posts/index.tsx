import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { postBoardOptionsQuery } from '@/features/community/api/queries';
import { postListSearch } from '@/features/community/screens/post-list/model/post-list-search';
import { PostListScreen } from '@/features/community/screens/post-list/ui/PostListScreen';

/**
 * 9.2 게시물 목록. 목록 query 는 진입 즉시 조회여도 loader 에서 기다리지 않는다. 검색 영역의 게시판
 * 선택지만 미리 데워 두되 기다리지 않는다 — 필드가 자기 로딩·실패·재시도를 그리므로 예열이 실패해도
 * route 는 연다. URL 해소는 화면이 한 번 한다.
 */
export const Route = createFileRoute('/_app/community/posts/')({
  validateSearch: postListSearch.schema,
  beforeLoad: canonicalSearchGuard(postListSearch.canonical),
  loader: ({ context }) => {
    void context.queryClient.query(postBoardOptionsQuery(context.locale)).catch(() => undefined);
  },
  component: PostListRoute,
});

function PostListRoute() {
  const navigate = Route.useNavigate();
  return (
    <PostListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
      onActivate={(postId) => {
        void navigate({ to: '/community/posts/$postId', params: { postId } });
      }}
      onCreate={() => {
        void navigate({ to: '/community/posts/new' });
      }}
    />
  );
}
