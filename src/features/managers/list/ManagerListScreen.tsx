import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { useTranslation } from 'react-i18next';
import { ManagerListFilters } from './ManagerListFilters';
import { ManagerListResult } from './ManagerListResult';
import { resolveManagerSearch, type ManagerRouteSearch } from './search-schema';
import { useManagerListData } from './useManagerListData';
import { useManagerListFilter } from './useManagerListFilter';
import { useManagerListResult } from './useManagerListResult';

export function ManagerListScreen({
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

  return (
    <section>
      <PageHeader breadcrumb={t('breadcrumb')} title={t('title')} />
      <ManagerListFilters filter={filter} />
      <ManagerListResult data={data} result={result} />
    </section>
  );
}
