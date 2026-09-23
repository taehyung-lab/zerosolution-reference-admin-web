import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { bannerListSearch } from '@/features/exhibitions/screens/banner-list/model/banner-list-search';
import { BannerListScreen } from '@/features/exhibitions/screens/banner-list/ui/BannerListScreen';

/**
 * 7.1 전시 > 배너 목록. 목록 query 는 진입 즉시 조회여도 loader 에서 기다리지 않는다. 검색 영역의 선택지가
 * 전부 도메인 enum 이라 예열할 선택지 query 도 없다. URL 해소는 화면이 한 번 한다.
 */
export const Route = createFileRoute('/_app/exhibitions/banners/')({
  validateSearch: bannerListSearch.schema,
  beforeLoad: canonicalSearchGuard(bannerListSearch.canonical),
  component: BannerListRoute,
});

function BannerListRoute() {
  const navigate = Route.useNavigate();
  return (
    <BannerListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
      onActivate={(bannerId) => {
        void navigate({ to: '/exhibitions/banners/$bannerId', params: { bannerId } });
      }}
      onCreate={() => {
        void navigate({ to: '/exhibitions/banners/new' });
      }}
    />
  );
}
