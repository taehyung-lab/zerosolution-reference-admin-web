import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { bannerDetailQueryOptions } from '@/features/exhibitions/api/queries';
import { BannerEditScreen } from '@/features/exhibitions/screens/banner-form/ui/BannerEditScreen';

export const Route = createFileRoute('/_app/exhibitions/banners/$bannerId/edit')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, bannerDetailQueryOptions(context.locale, params.bannerId), { preload }),
  component: BannerEditRoute,
});

function BannerEditRoute() {
  const { bannerId } = Route.useParams();
  const navigate = Route.useNavigate();
  const goToDetail = () => {
    void navigate({ to: '/exhibitions/banners/$bannerId', params: { bannerId } });
  };
  return <BannerEditScreen key={bannerId} bannerId={bannerId} onSaved={goToDetail} onCancel={goToDetail} />;
}
