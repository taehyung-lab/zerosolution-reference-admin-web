import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { accessListSearch, type AccessListSearch, type AccessListView } from '../model/access-list-search';
import { useAccessListData } from '../model/useAccessListData';
import { useAccessListFilter } from '../model/useAccessListFilter';
import { AccessListActions } from './AccessListActions';
import { AccessListFilters } from './AccessListFilters';
import { useAccessListResult } from './useAccessListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { accessSortKeys } from '@/features/members/model/member-records';

/** 4.5 회원접속 목록. 검색 전에는 조회하지 않고, 검색 뒤 선택한 행 또는 조건 전체를 다운로드 요청에 넘긴다. */
export function MemberAccessListScreen({
  search: sparse,
  onSearchChange,
  onCreate,
}: {
  readonly search: AccessListSearch;
  readonly onSearchChange: (next: AccessListSearch) => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('members');
  const search = accessListSearch.resolve(sparse);
  const commit = (next: AccessListView) => onSearchChange(accessListSearch.canonical.parse(next));
  const filter = useAccessListFilter(search, commit);
  const { rows, total, totalPages, ...data } = useAccessListData(search);
  const result = useAccessListResult({ search, rows, totalPages, commit });

  return (
    <section>
      <PageHeader title={t('screens.access')} breadcrumbs={[t('path.members'), t('screens.access')]} />
      <AccessListFilters filter={filter} />
<PagedListResult
        data={{ rows, ...data }}
        total={total}
        view={result.view}
        columns={result.columns}
        getRowId={(row) => row.id}
        actions={<AccessListActions search={search} selectedIds={result.selection.selectedIds} onCreate={onCreate} />}
        copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
        pageSizeOptions={standardPageSizeOptions}
        sortOptions={accessSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
      />
    </section>
  );
}
