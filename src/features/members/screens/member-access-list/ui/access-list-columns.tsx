import type { TFunction } from 'i18next';
import { formatMemberInstant } from '@/features/members/lib/format-member-instant';
import type { AccessSortKey, MemberAccessRow } from '@/features/members/model/member-records';
import { headerSortDirection } from '@/shared/lib/list-sort';
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact';
import type { PageRowSelection } from '@/shared/model/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { AccessListView } from '../model/access-list-search';

type Column = DataTableProps<MemberAccessRow>['columns'][number];

/** Figma 4.5 table 의 컬럼 순서. 모든 컬럼이 정렬 키다. */
export function accessListColumns({
  t,
  search,
  selection,
  onHeaderSort,
}: {
  readonly t: TFunction<'members'>;
  readonly search: AccessListView;
  readonly selection: PageRowSelection<MemberAccessRow>;
  readonly onHeaderSort: (key: AccessSortKey) => void;
}): DataTableProps<MemberAccessRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const sortable = (key: AccessSortKey, accessorFn: (row: MemberAccessRow) => string): Column => ({
    id: key,
    header: t(`fields.${key}`),
    accessorFn,
    meta: { sort: { direction: headerSortDirection(active, key), onSort: () => onHeaderSort(key) } },
  });

  return [
    selectionColumn({
      selection,
      pageLabel: t('result.selectPage'),
      rowLabel: (row) => t('result.selectRow', { name: row.email }),
    }),
    sortable('grade', (row) => row.grade),
    sortable('email', (row) => maskEmail(row.email)),
    sortable('name', (row) => row.name),
    sortable('phone', (row) => maskPhone(row.phone)),
    sortable('accountStatus', (row) => t(`accountStatus.${row.accountStatus}`)),
    sortable('accessedAt', (row) => formatMemberInstant(row.accessedAt)),
    sortable('accessPath', (row) => t(`accessPath.${row.accessPath}`)),
  ];
}
