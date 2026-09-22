import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { postDetailQueryOptions } from '@/features/community/api/queries';
import { PostEditScreen } from '@/features/community/screens/post-form/ui/PostEditScreen';

export const Route = createFileRoute('/_app/community/posts/$postId/edit')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, postDetailQueryOptions(context.locale, params.postId), { preload }),
  component: PostEditRoute,
});

function PostEditRoute() {
  const { postId } = Route.useParams();
  const navigate = Route.useNavigate();
  const goToDetail = () => {
    void navigate({ to: '/community/posts/$postId', params: { postId } });
  };
  return <PostEditScreen key={postId} postId={postId} onSaved={goToDetail} onCancel={goToDetail} />;
}
