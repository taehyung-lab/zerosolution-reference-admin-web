import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { managerListSearch } from '@/features/managers/screens/manager-list/model/manager-list-search';
import { ManagerListScreen } from '@/features/managers/screens/manager-list/ui/ManagerListScreen';

/**
 * 검색 전 상태를 가진 목록이라 진입 URL 에서는 목록 query 를 열지 않는다. 옵션 query 는 화면의 필드가
 * 스스로 열고 실패를 필드 안에서 보이므로 loader 에서 기다리지 않는다. URL 해소는 화면이 한 번 한다.
 */
export const Route = createFileRoute('/_app/managers/')({
  validateSearch: managerListSearch.schema,
  beforeLoad: canonicalSearchGuard(managerListSearch.canonical),
  component: ManagerListRoute,
});

function ManagerListRoute() {
  const navigate = Route.useNavigate();
  return (
    <ManagerListScreen
      search={Route.useSearch()}
      onSearchChange={(next) => {
        void navigate({ search: () => next });
      }}
      onActivate={(managerId) => {
        void navigate({ to: '/managers/$managerId', params: { managerId } });
      }}
      onCreate={() => {
        void navigate({ to: '/managers/new' });
      }}
    />
  );
}
