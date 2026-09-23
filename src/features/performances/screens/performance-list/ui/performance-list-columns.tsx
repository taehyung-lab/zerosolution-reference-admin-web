import type { TFunction } from 'i18next';
import {
  performanceSortKeys,
  type PerformanceRow,
  type PerformanceSortKey,
} from '@/features/performances/model/performance';
import { formatDate } from '@/shared/lib/datetime';
import { headerSortDirection } from '@/shared/lib/list-sort';
import { descendingRowNumber } from '@/shared/lib/list-view';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import type { PerformanceListView } from '../model/performance-list-search';

/** 원장 5.2 table 의 컬럼 순서. 행 checkbox 는 없다. 정렬 축이 있는 컬럼에만 헤더 정렬을 건다. */
const columnOrder = [
  'ticketKind',
  'performanceType',
  'title',
  'sessionCount',
  'performers',
  'organizer',
  'period',
  'venueName',
  'seller',
  'updatedAt',
] as const satisfies readonly (keyof PerformanceRow)[];

const sortKeyOf = (field: (typeof columnOrder)[number]): PerformanceSortKey | undefined =>
  performanceSortKeys.find((key) => key === field);

export function performanceListColumns({
  t,
  search,
  total,
  onHeaderSort,
}: {
  readonly t: TFunction<'performances'>;
  readonly search: PerformanceListView;
  readonly total: number;
  readonly onHeaderSort: (key: PerformanceSortKey) => void;
}): DataTableProps<PerformanceRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const cell = (row: PerformanceRow, field: (typeof columnOrder)[number]): string | number => {
    const value = row[field];
    if (field === 'updatedAt') return formatDate(String(value));
    if (field === 'ticketKind' || field === 'performanceType' || field === 'seller')
      return t(`options.${String(value)}`);
    return value;
  };

  return [
    {
      id: 'number',
      header: t('fields.number'),
      cell: ({ row }) => descendingRowNumber(search, total, row.index),
    },
    ...columnOrder.map((field) => {
      const sortKey = sortKeyOf(field);
      return {
        id: field,
        header: t(`fields.${field}`),
        accessorFn: (row: PerformanceRow) => cell(row, field),
        ...(sortKey === undefined
          ? {}
          : {
              meta: {
                sort: { direction: headerSortDirection(active, sortKey), onSort: () => onHeaderSort(sortKey) },
              },
            }),
      };
    }),
  ];
}
