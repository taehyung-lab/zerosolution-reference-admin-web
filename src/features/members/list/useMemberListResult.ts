import { standardPageSizeOptions } from '@/shared/config/list';
import { formatCount } from '@/shared/lib/format';
import type { ResultSummaryGroup } from '@/shared/ui/patterns/ResultSummary';
import { useTranslation } from 'react-i18next';
import { buildMemberColumns } from './member-columns';
import type { MemberListDefinition } from './member-list-definition';
import { usePageRowSelection } from '@/shared/lib/use-page-row-selection';
import { changeMemberListPage, changeMemberListView } from './member-list-policy';
import type { MemberListData } from './useMemberListData';
import {
  memberSortTypes,
  toMemberRouteSearch,
  type MemberRouteSearch,
  type MemberSearch,
} from './search-schema';

export function useMemberListResult({
  search,
  data,
  definition,
  onSearchChange,
}: {
  readonly search: MemberSearch;
  readonly data: MemberListData;
  readonly definition: MemberListDefinition;
  readonly onSearchChange: (next: MemberRouteSearch) => void;
}) {
  const { t, i18n } = useTranslation('members');
  const applySearch = (next: MemberSearch) => onSearchChange(toMemberRouteSearch(next));

  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.key,
    isSelectable: (row) => row.selectable !== false,
    resetKey: JSON.stringify(toMemberRouteSearch(search)),
  });

  const changeSort = (sortType: MemberSearch['sortType']) =>
    applySearch(
      changeMemberListView(search, {
        sortType,
        sortDirection:
          search.sortType === sortType && search.sortDirection === 'desc' ? 'asc' : search.sortDirection,
      }),
    );

  const summaryGroups: readonly ResultSummaryGroup[] = [
    {
      key: 'total',
      items: [
        { key: 'total', text: t('result.total', { count: formatCount(i18n.language, data.total) }) },
      ],
    },
  ];

  return {
    selectedIds: selection.selectedIds,
    columns: buildMemberColumns({
      t,
      definition,
      sort: { type: search.sortType, direction: search.sortDirection },
      onSortChange: changeSort,
      selection,
    }),
    summaryGroups,
    pageSize: {
      value: search.pageSize,
      options: standardPageSizeOptions,
      onChange: (pageSize: number) =>
        applySearch(changeMemberListView(search, { pageSize: pageSize as MemberSearch['pageSize'] })),
    },
    sort: {
      value: search.sortType,
      options: memberSortTypes.map((value) => ({ value, label: t(`columns.${value}`) })),
      onValueChange: changeSort,
    },
    pagination: {
      page: search.page,
      totalPages: data.totalPages,
      onPageChange: (page: number) => applySearch(changeMemberListPage(search, page)),
    },
  };
}
