import { managerTypeOptionsQuery } from '@/features/managers/api/queries';
import { canonicalSearchGuard } from '@/app/router/canonical-search-guard';
import { ManagerApiListScreen } from '@/features/managers/list/ManagerApiListScreen';
import {
  managerCanonicalSearchSchema,
  managerSearchSchema,
  type ManagerRouteSearch,
  type ManagerRouteSearchInput,
} from '@/features/managers/list/search-schema';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { DevelopmentNotice } from '@/app/shell/DevelopmentNotice';
import { env } from '@/env';
import { ManagerListScreen } from '@/features/managers/list/ManagerListScreen';
import {
  managerListSearchSchema,
  type ManagerListSearch,
} from '@/features/managers/list/manager-list-search';

type ManagerEntrySearch = {
  [K in keyof ManagerRouteSearchInput | keyof ManagerListSearch]?:
    | (K extends keyof ManagerRouteSearchInput ? ManagerRouteSearchInput[K] : never)
    | (K extends keyof ManagerListSearch ? ManagerListSearch[K] : never);
};

export const Route = createFileRoute('/_app/managers/')({
  validateSearch: (search: Record<string, unknown>): ManagerEntrySearch =>
    env.VITE_REFERENCE_SCENARIOS
      ? managerListSearchSchema.parse(search)
      : managerSearchSchema.parse(search),
  beforeLoad: (args) => {
    if (env.VITE_REFERENCE_SCENARIOS) canonicalSearchGuard(managerListSearchSchema)(args);
    else canonicalSearchGuard(managerCanonicalSearchSchema)(args);
  },
  loader: ({ context: { locale, queryClient } }) => {
    if (env.VITE_REFERENCE_SCENARIOS) return;
    void queryClient.query(managerTypeOptionsQuery(locale)).catch(() => undefined);
  },
  component: ManagerListRoute,
});

function ManagerListRoute() {
  const rawSearch = Route.useSearch();
  const search = managerCanonicalSearchSchema.parse(rawSearch);
  const navigate = Route.useNavigate();
  const [ready, setReady] = useState(false);

  // TRANSPLANT_PENDING_MANAGER_SEARCH_INPUT: product search is validated before future wire mapping.
  if (env.VITE_REFERENCE_SCENARIOS)
    return (<>
      <DevelopmentNotice ready={ready} />
      <ManagerListScreen
        search={managerListSearchSchema.parse(rawSearch)}
        onSearchChange={(next) => {
          void navigate({ search: () => next });
        }}
        onActionRequest={() => setReady(true)}
      />
    </>);

  return (
    <ManagerApiListScreen
      search={search}
      onSearchChange={(next: ManagerRouteSearch) => {
        void navigate({ search: () => next });
      }}
    />
  );
}
