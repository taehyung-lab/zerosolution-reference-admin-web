import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import {
  managerListSearch,
  type ManagerListSearch,
  type ManagerListView,
} from '../model/manager-list-search';
import { useManagerListData } from '../model/useManagerListData';
import { useManagerListFilter } from '../model/useManagerListFilter';
import { ManagerListActions } from './ManagerListActions';
import { ManagerListFilters } from './ManagerListFilters';
import { ManagerListResult } from './ManagerListResult';
import { useManagerListResult } from './useManagerListResult';

/**
 * 11.1 운영자 목록(설정 > 운영자). 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 를 넘기고 화면이 한 번 해소한다. 모든 URL 전이는 `commit` 한 곳으로
 * 나가며 canonical 로 줄여 `onSearchChange` 에 넘긴다. 검색 전(`searched` 없음)에는 조회하지 않는다.
 */
export function ManagerListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
  onCreate,
}: {
  readonly search: ManagerListSearch;
  readonly onSearchChange: (next: ManagerListSearch) => void;
  readonly onActivate: (managerId: string) => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('managers');
  const search = managerListSearch.resolve(sparse);
  const commit = (next: ManagerListView) => onSearchChange(managerListSearch.canonical.parse(next));
  const filter = useManagerListFilter(search, commit);
  const { rows, total, totalPages, ...data } = useManagerListData(search);
  const result = useManagerListResult({ search, rows, totalPages, commit });

  return (
    <section>
      <PageHeader title={t('title')} breadcrumbs={[t('path.settings'), t('path.managers')]} />
      <ManagerListFilters filter={filter} />
      <ManagerListResult
        data={{ rows, ...data }}
        total={total}
        result={result}
        actions={
          <ManagerListActions
            searched={search.searched}
            selectedIds={result.selection.selectedIds}
            rows={rows}
            onCreate={onCreate}
          />
        }
        onActivate={onActivate}
      />
    </section>
  );
}
