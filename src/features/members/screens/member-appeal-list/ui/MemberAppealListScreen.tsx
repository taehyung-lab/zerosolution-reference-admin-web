import { useTranslation } from 'react-i18next';
import type { MemberMessageChannel } from '@/features/members/model/member';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import { standardPageSizeOptions } from '@/shared/lib/list-options';
import { appealSortKeys } from '@/features/members/model/member-records';
import { appealListSearch, type AppealListSearch, type AppealListView } from '../model/appeal-list-search';
import { useAppealListData } from '../model/useAppealListData';
import { useAppealListFilter } from '../model/useAppealListFilter';
import { AppealListActions } from './AppealListActions';
import { AppealListFilters } from './AppealListFilters';
import { useAppealListResult } from './useAppealListResult';

/** 4.7 불량회원 소명신청 목록. 진입 즉시 조회한다. 행 클릭은 소명신청 조회로, SMS·이메일은 route 가 조립한다. */
export function MemberAppealListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
  onMessage,
}: {
  readonly search: AppealListSearch;
  readonly onSearchChange: (next: AppealListSearch) => void;
  readonly onActivate: (appealId: string) => void;
  readonly onMessage: (channel: MemberMessageChannel, ids: readonly string[]) => void;
}) {
  const { t } = useTranslation('members');
  const search = appealListSearch.resolve(sparse);
  const commit = (next: AppealListView) => onSearchChange(appealListSearch.canonical.parse(next));
  const filter = useAppealListFilter(search, commit);
  const { rows, total, totalPages, ...data } = useAppealListData(search);
  const result = useAppealListResult({ search, rows, totalPages, commit });

  return (
    <section>
      <PageHeader title={t('screens.appeals')} breadcrumbs={[t('path.members'), t('screens.appeals')]} />
      <AppealListFilters filter={filter} />
      <PagedListResult
        data={{ rows, ...data }}
        total={total}
        view={result.view}
        columns={result.columns}
        getRowId={(row) => row.id}
        onRowActivate={(row) => onActivate(row.id)}
        actions={<AppealListActions selectedIds={result.selection.selectedIds} onMessage={onMessage} />}
        copy={{ empty: t('result.empty') }}
        pageSizeOptions={standardPageSizeOptions}
        sortOptions={appealSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
      />
    </section>
  );
}
