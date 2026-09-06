import { ManagerListActions } from './ManagerListActions';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { useTranslation } from 'react-i18next';
import { ManagerListFilters } from './ManagerListFilters';
import { ManagerListResult } from './ManagerListResult';
import { resolveManagerSearch, type ManagerRouteSearch } from './search-schema';
import { useManagerListData } from './useManagerListData';
import { useManagerListFilter } from './useManagerListFilter';
import { useManagerListResult } from './useManagerListResult';

export function ManagerApiListScreen({
  search,
  onSearchChange,
}: {
  readonly search: ManagerRouteSearch;
  readonly onSearchChange: (next: ManagerRouteSearch) => void;
}) {
  const { t } = useTranslation('managers');
  const filter = useManagerListFilter({ search, onSearchChange });
  const data = useManagerListData(search);
  const resolvedSearch = resolveManagerSearch(search);
  const result = useManagerListResult({
    search: resolvedSearch,
    data,
    onSearchChange,
  });

  /**
   * The request boundary. See `MemberListScreen` for the shape a real mutation takes here.
   * TRANSPLANT_PENDING_MANAGER_LIST_ACTIONS: the assembled request stops here until the
   * manager bulk contract exists.
   */
  const onActionRequest = () => undefined;

  return (
    <section>
      <PageHeader breadcrumb={t('breadcrumb')} title={t('title')} />
      <ManagerListFilters filter={filter} />
      <ManagerListResult
        data={data}
        result={result}
        toolbarRight={
          <ManagerListActions
            searched={data.searched}
            selectedIds={result.selectedIds}
            rows={data.rows}
            onActionRequest={onActionRequest}
          />
        }
      />
    </section>
  );
}
