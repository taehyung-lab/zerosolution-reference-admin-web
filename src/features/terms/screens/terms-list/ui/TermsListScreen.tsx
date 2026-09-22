import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import { standardPageSizeOptions } from '@/shared/lib/list-options';
import { termsSortKeys } from '@/features/terms/model/terms';
import {
  termsListSearch,
  type TermsListSearch,
  type TermsListView,
} from '../model/terms-list-search';
import { useTermsListData } from '../model/useTermsListData';
import { useTermsListFilter } from '../model/useTermsListFilter';
import { TermsListActions } from './TermsListActions';
import { TermsListFilters } from './TermsListFilters';
import { useTermsListResult } from './useTermsListResult';

/**
 * 11.2 약관 목록. 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 를 넘기고 화면이 한 번 해소한다. 모든 URL 전이는 `commit` 한 곳으로
 * 나가며 canonical 로 줄여 `onSearchChange` 에 넘긴다.
 *
 * frame 의 제목·브레드크럼은 `{약관1}` 이라는 자리표시자다 — LNB 에서 `약관` 아래 항목 하나를 고른
 * 상태를 그린 것으로 보이지만 그 목록의 출처와 URL 은 미확인이라(TERMS-LIST 미확인 6) 메뉴 이름
 * `약관` 을 제목으로 쓴다.
 */
export function TermsListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
  onCreate,
}: {
  readonly search: TermsListSearch;
  readonly onSearchChange: (next: TermsListSearch) => void;
  readonly onActivate: (termsId: string) => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('terms');
  const search = termsListSearch.resolve(sparse);
  const commit = (next: TermsListView) => onSearchChange(termsListSearch.canonical.parse(next));
  const filter = useTermsListFilter(search, commit);
  const { rows, total, totalPages, ...data } = useTermsListData(search);
  const result = useTermsListResult({ search, rows, totalPages, commit });

  return (
    <section>
      <PageHeader
        breadcrumbs={[t('terms.breadcrumb.settings'), t('terms.breadcrumb.terms')]}
        title={t('terms.title')}
      />
      <TermsListFilters filter={filter} />
      <PagedListResult
        data={{ rows, ...data }}
        total={total}
        view={result.view}
        columns={result.columns}
        getRowId={(row) => row.id}
        onRowActivate={(row) => onActivate(row.id)}
        actions={
          <TermsListActions
            selectedIds={result.selection.selectedIds}
            onChanged={result.selection.clear}
            onCreate={onCreate}
          />
        }
        copy={{ empty: t('terms.result.empty') }}
        pageSizeOptions={standardPageSizeOptions}
        sortOptions={termsSortKeys.map((value) => ({ value, label: t(`terms.sort.${value}`) }))}
      />
    </section>
  );
}
