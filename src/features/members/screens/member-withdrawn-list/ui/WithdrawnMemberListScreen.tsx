import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Button } from '@/shared/ui/primitives/Button';
import { useWithdrawnListData } from '../model/useWithdrawnListData';
import { useWithdrawnListFilter } from '../model/useWithdrawnListFilter';
import { withdrawnListSearch, type WithdrawnListSearch, type WithdrawnListView } from '../model/withdrawn-list-search';
import { useWithdrawnListResult } from './useWithdrawnListResult';
import { WithdrawnListFilters } from './WithdrawnListFilters';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { withdrawnSortKeys } from '@/features/members/model/member-records';

/**
 * 4.4 탈퇴회원 목록. toolbar 액션은 `등록` 하나라 별도 액션 훅·컴포넌트 없이 여기서 조립한다.
 * 행 클릭은 탈퇴회원 조회로 간다. 검색 전에는 조회하지 않는다.
 */
export function WithdrawnMemberListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
  onCreate,
}: {
  readonly search: WithdrawnListSearch;
  readonly onSearchChange: (next: WithdrawnListSearch) => void;
  readonly onActivate: (memberId: string) => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('members');
  const search = withdrawnListSearch.resolve(sparse);
  const commit = (next: WithdrawnListView) => onSearchChange(withdrawnListSearch.canonical.parse(next));
  const filter = useWithdrawnListFilter(search, commit);
  const { rows, total, totalPages, ...data } = useWithdrawnListData(search);
  const result = useWithdrawnListResult({ search, rows, totalPages, commit });

  return (
    <section>
      <PageHeader title={t('screens.withdrawn')} breadcrumbs={[t('path.members'), t('screens.withdrawn')]} />
      <WithdrawnListFilters filter={filter} />
<PagedListResult
        data={{ rows, ...data }}
        total={total}
        view={result.view}
        columns={result.columns}
        getRowId={(row) => row.id}
        onRowActivate={(row) => onActivate(row.id)}
        actions={<Button onClick={onCreate}>{t('actions.register')}</Button>}
        copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
        pageSizeOptions={standardPageSizeOptions}
        sortOptions={withdrawnSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
      />
    </section>
  );
}
