import { createFileRoute } from '@tanstack/react-router';
import { BannerCreateScreen } from '@/features/exhibitions/screens/banner-form/ui/BannerCreateScreen';

export const Route = createFileRoute('/_app/exhibitions/banners/new')({
  component: BannerCreateRoute,
});

/**
 * 저장 완료의 목적지는 `등록된 조회 화면` 이다. 서버 미연결 동안 등록 응답에 새 ID 가 없으면 조회할
 * 레코드가 없으므로 목록으로 간다. 취소는 목록으로 돌아간다.
 */
function BannerCreateRoute() {
  const navigate = Route.useNavigate();
  const goToList = () => {
    void navigate({ to: '/exhibitions/banners' });
  };
  return (
    <BannerCreateScreen
      onSaved={(bannerId) => {
        if (bannerId === undefined) goToList();
        else void navigate({ to: '/exhibitions/banners/$bannerId', params: { bannerId } });
      }}
      onCancel={goToList}
    />
  );
}
