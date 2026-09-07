import { createFileRoute } from '@tanstack/react-router';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { ManagerListScreen } from '@/features/managers/list/ManagerListScreen';
import { managerListSearchSchema } from '@/features/managers/list/model/manager-list-search';
import { requestManagerBulkChange } from '@/features/managers/list/model/manager-list-requests';
export const Route = createFileRoute('/_app/managers/')({ validateSearch: managerListSearchSchema, beforeLoad: canonicalSearchGuard(managerListSearchSchema), component: ManagerListRoute });
function ManagerListRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  // TRANSPLANT_PENDING_MANAGER_SEARCH_INPUT: 제품 검색 조건은 유지하고 서버 요청 매핑만 계약 확정 후 연결한다.
  return <ManagerListScreen search={search} onSearchChange={next => { void navigate({ search: () => next }); }} onActionRequest={requestManagerBulkChange} />;
}
