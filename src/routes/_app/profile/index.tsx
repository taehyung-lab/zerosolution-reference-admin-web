import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { profileDetailQueryOptions } from '@/features/profile/api/queries';
import { ProfileDetailScreen } from '@/features/profile/screens/profile-detail/ui/ProfileDetailScreen';

export const Route = createFileRoute('/_app/profile/')({
  loader: ({ context, preload }) =>
    loadRequired(context.queryClient, profileDetailQueryOptions(context.locale), { preload }),
  component: ProfileDetailRoute,
});

/** 대상은 세션이 정하므로 params 가 없다. 탈퇴 완료의 목적지는 원문이 정한 로그인 화면이다. */
function ProfileDetailRoute() {
  const navigate = Route.useNavigate();
  return (
    <ProfileDetailScreen
      onEdit={() => {
        void navigate({ to: '/profile/edit' });
      }}
      onWithdrawn={() => {
        void navigate({ to: '/login', search: {} });
      }}
    />
  );
}
