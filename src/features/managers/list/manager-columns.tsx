import type { PageRowSelection } from '@/shared/lib/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/patterns/DataTable';
import { Badge } from '@/shared/ui/primitives/Badge';
import { Checkbox } from '@/shared/ui/primitives/Checkbox';
import { Link } from '@tanstack/react-router';
import type { TFunction } from 'i18next';
import type { ManagerListItem } from '../model/manager';
import { managerStatusMeta } from '../model/status';
import {
  managerSortFields,
  sortDirectionFor,
  type ManagerSortState,
  type ManagerSortType,
} from './manager-sort';

export type { ManagerSortState } from './manager-sort';

type ManagerColumn = DataTableProps<ManagerListItem>['columns'][number];

/** `ColumnDef` is a union, so a plain `Omit` would drop `accessorKey`; omit per member instead. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type SortableColumnRest = DistributiveOmit<ManagerColumn, 'id' | 'header' | 'meta'>;

export function buildManagerColumns({
  t,
  formatDate,
  sort,
  onSortChange,
  selection,
}: {
  readonly t: TFunction<'managers'>;
  readonly formatDate: (value: string) => string;
  readonly sort: ManagerSortState;
  readonly onSortChange: (sortType: ManagerSortType) => void;
  readonly selection: PageRowSelection<ManagerListItem>;
}): DataTableProps<ManagerListItem>['columns'] {
  /** A sortable column takes its id, label, and sort meta from the single sort table. */
  const sortable = (sortType: ManagerSortType, column: SortableColumnRest): ManagerColumn => {
    const field = managerSortFields[sortType];
    return {
      ...column,
      id: field.columnId,
      header: t(field.labelKey),
      meta: {
        sort: {
          direction: sortDirectionFor(sort, sortType),
          onSort: () => onSortChange(sortType),
        },
      },
    };
  };
  const dateCell = (value: string) => (value === '-' ? '-' : formatDate(value));

  return [
    {
      id: 'selection',
      header: () => (
        <Checkbox
          aria-label={t('result.selectAll')}
          checked={selection.isAllChecked}
          indeterminate={selection.isMixed}
          onChange={(event) => selection.togglePage(event.target.checked)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t('result.selectRow', { id: row.original.id })}
          checked={selection.isChecked(row.original)}
          onChange={(event) => selection.toggleRow(row.original, event.target.checked)}
        />
      ),
    },
    sortable('TYPE', { accessorKey: 'type' }),
    sortable('ORGANIZATION', { accessorKey: 'organization' }),
    sortable('ID', {
      cell: ({ row }) => (
        <Link
          className="underline"
          to="/managers/$managerId"
          params={{ managerId: row.original.id }}
        >
          {row.original.id}
        </Link>
      ),
    }),
    sortable('NAME', { accessorKey: 'name' }),
    { id: 'phone', header: t('columns.phone'), accessorKey: 'phone' },
    sortable('PERMISSION', { accessorKey: 'permission' }),
    {
      id: 'registrationRoute',
      header: t('columns.registrationRoute'),
      accessorKey: 'registrationRoute',
    },
    sortable('STATUS', {
      cell: ({ row }) => {
        const { labelKey, tone } = managerStatusMeta(row.original.status);
        return (
          <Badge tone={tone}>
            {row.original.accountStatus
              ? t(`accountStatus.${row.original.accountStatus}`)
              : t(labelKey)}
          </Badge>
        );
      },
    }),
    sortable('CREATED_AT', {
      cell: ({ row }) => dateCell(row.original.createdAt),
    }),
    sortable('UPDATED_AT', {
      cell: ({ row }) => dateCell(row.original.updatedAt),
    }),
  ];
}
