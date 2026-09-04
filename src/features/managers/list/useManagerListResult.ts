import { formatDate } from '@/shared/lib/datetime';
import { formatCount } from '@/shared/lib/format';
import type { DataTableProps } from '@/shared/ui/patterns/DataTable';
import type { ResultSummaryGroup } from '@/shared/ui/patterns/ResultSummary';
import { useTranslation } from 'react-i18next';
import type { ManagerListItem } from '../model/manager';
import { buildManagerColumns } from './manager-columns';
import {
  managerSortFields,
  managerSortTypes,
  type ManagerSortType,
} from './manager-sort';
import {
  changeManagerPageSize,
  goToManagerPage,
  managerPageSizeOptions,
  selectManagerSort,
} from './manager-list-policy';
import {
  toManagerRouteSearch,
  type ManagerRouteSearch,
  type ManagerSearch,
} from './search-schema';
import type { ManagerListData } from './useManagerListData';

export function useManagerListResult({
  search,
  data,
  onSearchChange,
}: {
  readonly search: ManagerSearch;
  readonly data: ManagerListData;
  readonly onSearchChange: (next: ManagerRouteSearch) => void;
}) {
  const { i18n, t } = useTranslation('managers');
  const { t: sharedT } = useTranslation('shared');
  const applySearch = (next: ManagerSearch) =>
    onSearchChange(toManagerRouteSearch(next));
  const changeSort = (sortType: ManagerSortType) =>
    applySearch(selectManagerSort(search, sortType));

  const columns: DataTableProps<ManagerListItem>['columns'] =
    buildManagerColumns({
      t,
      formatDate,
      sort: { type: search.sortType, direction: search.sortDirection },
      onSortChange: changeSort,
    });
  const summaryGroups: readonly ResultSummaryGroup[] = [
    {
      key: 'total',
      items: [
        {
          key: 'total',
          text: sharedT('list.total', {
            formatted: formatCount(i18n.language, data.total),
          }),
        },
      ],
    },
  ];

  return {
    columns,
    summaryGroups,
    pageSize: {
      value: search.pageSize,
      options: managerPageSizeOptions,
      onChange: (pageSize: number) =>
        applySearch(changeManagerPageSize(search, pageSize)),
    },
    sort: {
      value: search.sortType,
      options: managerSortTypes.map((type) => ({
        value: type,
        label: t(managerSortFields[type].labelKey),
      })),
      onValueChange: changeSort,
    },
    pagination: {
      page: search.page,
      totalPages: data.totalPages,
      onPageChange: (page: number) => applySearch(goToManagerPage(search, page)),
    },
  };
}
