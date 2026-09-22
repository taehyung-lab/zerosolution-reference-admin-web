import { createFileRoute, useRouter } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { postDetailQueryOptions } from '@/features/community/api/queries';
import { PostDetailScreen } from '@/features/community/screens/post-detail/ui/PostDetailScreen';

export const Route = createFileRoute('/_app/community/posts/$postId/')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, postDetailQueryOptions(context.locale, params.postId), { preload }),
  component: PostDetailRoute,
});

function PostDetailRoute() {
  const { postId } = Route.useParams();
  const navigate = Route.useNavigate();
  const router = useRouter();
  return (
    <PostDetailScreen
      key={postId}
      postId={postId}
      onEdit={(id) => {
        void navigate({ to: '/community/posts/$postId/edit', params: { postId: id } });
      }}
      onDeleted={() => {
        void navigate({ to: '/community/posts' });
      }}
      onOpenMember={(memberId) => {
        // Notion `회원 조회 → 해당 회원 페이지를 새탭으로 제공`. 새 탭 열기는 route 의 책임이다.
        const href = router.buildLocation({ to: '/members/$memberId', params: { memberId } }).href;
        window.open(href, '_blank', 'noopener');
      }}
    />
  );
}
