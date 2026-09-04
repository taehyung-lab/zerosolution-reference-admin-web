import { managerTypeOptionsQuery } from '@/features/managers/api/queries';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { ManagerListScreen } from '@/features/managers/list/ManagerListScreen';
import {
  managerCanonicalSearchSchema,
  managerSearchSchema,
  type ManagerRouteSearch,
} from '@/features/managers/list/search-schema';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/managers/')({
  validateSearch: managerSearchSchema,
  beforeLoad: canonicalSearchGuard(managerCanonicalSearchSchema),
  loader: ({ context: { locale, queryClient } }) => {
    void queryClient
      .query(managerTypeOptionsQuery(locale))
      .catch(() => undefined);
  },
  component: ManagerListRoute,
});

function ManagerListRoute() {
  const search = managerCanonicalSearchSchema.parse(Route.useSearch());
  const navigate = Route.useNavigate();

  return (
    <ManagerListScreen
      search={search}
      onSearchChange={(next: ManagerRouteSearch) => {
        void navigate({ search: () => next });
      }}
    />
  );
}
