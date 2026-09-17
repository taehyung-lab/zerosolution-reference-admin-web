import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { profileDetailQueryOptions } from '@/features/profile/api/queries';
import { ProfileEditScreen } from '@/features/profile/screens/profile-form/ui/ProfileEditScreen';

export const Route = createFileRoute('/_app/profile/edit')({
  loader: ({ context, preload }) =>
    loadRequired(context.queryClient, profileDetailQueryOptions(context.locale), { preload }),
  component: ProfileEditRoute,
});

function ProfileEditRoute() {
  const navigate = Route.useNavigate();
  const goToDetail = () => {
    void navigate({ to: '/profile' });
  };
  return <ProfileEditScreen onSaved={goToDetail} onCancel={goToDetail} />;
}
