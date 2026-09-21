import { useTranslation } from 'react-i18next';
import type { MemberMessageChannel } from '@/features/members/model/member';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { dormantListSearch, type DormantListSearch, type DormantListView } from '../model/dormant-list-search';
import { useDormantListData } from '../model/useDormantListData';
import { useDormantListFilter } from '../model/useDormantListFilter';
import { DormantListActions } from './DormantListActions';
import { DormantListFilters } from './DormantListFilters';
import { useDormantListResult } from './useDormantListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { dormantSortKeys } from '@/features/members/model/member-records';

/**
 * 4.3 휴면회원 목록. 조립만 하고 상태는 각 소유자에 둔다. route 는 검증한 sparse search 를 넘기고 화면이 한 번
 * 해소한다. 모든 URL 전이는 `commit` 한 곳으로 나간다. 검색 전에는 조회하지 않는다. 행 클릭은 회원 조회로 간다.
 */
export function DormantMemberListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
  onCreate,
  onMessage,
}: {
  readonly search: DormantListSearch;
  readonly onSearchChange: (next: DormantListSearch) => void;
  readonly onActivate: (memberId: string) => void;
  readonly onCreate: () => void;
  readonly onMessage: (channel: MemberMessageChannel, ids: readonly string[]) => void;
}) {
  const { t } = useTranslation('members');
  const search = dormantListSearch.resolve(sparse);
  const commit = (next: DormantListView) => onSearchChange(dormantListSearch.canonical.parse(next));
  const filter = useDormantListFilter(search, commit);
  const { rows, total, totalPages, ...data } = useDormantListData(search);
  const result = useDormantListResult({ search, rows, totalPages, commit });

  return (
    <section>
      <PageHeader title={t('screens.dormant')} breadcrumbs={[t('path.members'), t('screens.dormant')]} />
      <DormantListFilters filter={filter} />
<PagedListResult
        data={{ rows, ...data }}
        total={total}
        view={result.view}
        columns={result.columns}
        getRowId={(row) => row.id}
        onRowActivate={(row) => onActivate(row.id)}
        actions={
          <DormantListActions
            searched={search.searched}
            selectedIds={result.selection.selectedIds}
            onCreate={onCreate}
            onMessage={onMessage}
          />
        }
        copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
        pageSizeOptions={standardPageSizeOptions}
        sortOptions={dormantSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
      />
    </section>
  );
}
