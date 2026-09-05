import { Checkbox } from '@/shared/ui/primitives/Checkbox';
import type { PageRowSelection } from '@/shared/lib/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/patterns/DataTable';
import type { TFunction } from 'i18next';
import type { MemberListDefinition } from './member-list-definition';
import type { MemberListRow } from './member-row';
import type { MemberSearch } from './search-schema';

type Column = DataTableProps<MemberListRow>['columns'][number];
type SortType = MemberSearch['sortType'];

export function buildMemberColumns({
  t,
  definition,
  sort,
  onSortChange,
  selection,
}: {
  readonly t: TFunction<'members'>;
  readonly definition: MemberListDefinition;
  readonly sort: { readonly type: SortType; readonly direction: MemberSearch['sortDirection'] };
  readonly onSortChange: (sortType: SortType) => void;
  readonly selection: PageRowSelection<MemberListRow>;
}): DataTableProps<MemberListRow>['columns'] {
  const sortable = (sortType: SortType, column: Column): Column => ({
    ...column,
    meta: {
      sort: {
        direction:
          sort.type === sortType
            ? sort.direction === 'asc'
              ? 'ascending'
              : 'descending'
            : undefined,
        onSort: () => onSortChange(sortType),
      },
    },
  });

  return [
    {
      id: 'selection',
      header: () => (
        <Checkbox
          aria-label={t('result.selectPage')}
          checked={selection.isAllChecked}
          indeterminate={selection.isMixed}
          onChange={(event) => selection.togglePage(event.target.checked)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t('result.selectRow', { name: row.original.name })}
          checked={selection.isChecked(row.original)}
          disabled={row.original.selectable === false}
          onChange={(event) => selection.toggleRow(row.original, event.target.checked)}
        />
      ),
    },
    { id: 'grade', header: t('columns.grade'), accessorKey: 'grade' },
    sortable('signupMethod', { id: 'signupMethod', header: t('columns.signupMethod'), accessorKey: 'signupMethod' }),
    sortable('email', { id: 'email', header: t('columns.email'), accessorKey: 'email' }),
    sortable('name', { id: 'name', header: t('columns.name'), accessorKey: 'name' }),
    sortable('phone', { id: 'phone', header: t('columns.phone'), accessorKey: 'phone' }),
    { id: 'accountStatus', header: t('columns.accountStatus'), accessorKey: 'accountStatus' },
    sortable('joinedAt', { id: 'joinedAt', header: t('columns.joinedAt'), accessorKey: 'joinedAt' }),
    sortable('lastAccessedAt', { id: 'lastAccessedAt', header: t('columns.lastAccessedAt'), accessorKey: 'lastAccessedAt' }),
    ...(definition.restrictionColumn
      ? [
          {
            id: 'restrictions',
            header: t('columns.restrictions'),
            cell: ({ row }: { row: { original: MemberListRow } }) => row.original.restrictions.join(', '),
          },
        ]
      : []),
  ];
}
