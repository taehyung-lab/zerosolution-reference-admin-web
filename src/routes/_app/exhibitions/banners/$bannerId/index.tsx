import { createFileRoute } from '@tanstack/react-router';
import { loadRequired } from '@/app/router/required-loader';
import { bannerDetailQueryOptions } from '@/features/exhibitions/api/queries';
import { BannerDetailScreen } from '@/features/exhibitions/screens/banner-detail/ui/BannerDetailScreen';

export const Route = createFileRoute('/_app/exhibitions/banners/$bannerId/')({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, bannerDetailQueryOptions(context.locale, params.bannerId), { preload }),
  component: BannerDetailRoute,
});

function BannerDetailRoute() {
  const { bannerId } = Route.useParams();
  const navigate = Route.useNavigate();
  return (
    <BannerDetailScreen
      key={bannerId}
      bannerId={bannerId}
      onEdit={(id) => {
        void navigate({ to: '/exhibitions/banners/$bannerId/edit', params: { bannerId: id } });
      }}
      onDeleted={() => {
        void navigate({ to: '/exhibitions/banners' });
      }}
    />
  );
}
