import { createFileRoute } from '@tanstack/react-router';
import { postBoardOptionsQuery } from '@/features/community/api/queries';
import { PostCreateScreen } from '@/features/community/screens/post-form/ui/PostCreateScreen';

/** 게시판 선택지는 필드가 자기 상태를 그리므로 예열만 하고 기다리지 않는다. */
export const Route = createFileRoute('/_app/community/posts/new')({
  loader: ({ context }) => {
    void context.queryClient.query(postBoardOptionsQuery(context.locale)).catch(() => undefined);
  },
  component: PostCreateRoute,
});

function PostCreateRoute() {
  const navigate = Route.useNavigate();
  const goToList = () => {
    void navigate({ to: '/community/posts' });
  };
  return <PostCreateScreen onSaved={goToList} onCancel={goToList} />;
}
