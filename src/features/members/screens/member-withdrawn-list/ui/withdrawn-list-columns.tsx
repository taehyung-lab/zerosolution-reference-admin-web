import type { TFunction } from 'i18next';
import { formatMemberInstant } from '@/features/members/lib/format-member-instant';
import type { WithdrawnMemberRow, WithdrawnSortKey } from '@/features/members/model/member-records';
import { headerSortDirection } from '@/shared/lib/list-sort';
import { maskEmail } from '@/shared/lib/mask-contact';
import type { PageRowSelection } from '@/shared/model/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { WithdrawnListView } from '../model/withdrawn-list-search';

type Column = DataTableProps<WithdrawnMemberRow>['columns'][number];

/** Figma 4.4 table 의 컬럼 순서. 탈퇴 뒤에는 이름·휴대폰이 없다. */
export function withdrawnListColumns({
  t,
  search,
  selection,
  onHeaderSort,
}: {
  readonly t: TFunction<'members'>;
  readonly search: WithdrawnListView;
  readonly selection: PageRowSelection<WithdrawnMemberRow>;
  readonly onHeaderSort: (key: WithdrawnSortKey) => void;
}): DataTableProps<WithdrawnMemberRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const sortable = (key: WithdrawnSortKey, accessorFn: (row: WithdrawnMemberRow) => string): Column => ({
    id: key,
    header: t(`fields.${key}`),
    accessorFn,
    meta: { sort: { direction: headerSortDirection(active, key), onSort: () => onHeaderSort(key) } },
  });

  return [
    selectionColumn({
      selection,
      pageLabel: t('result.selectPage'),
      rowLabel: (row) => t('result.selectRow', { name: maskEmail(row.email) }),
    }),
    sortable('signupMethod', (row) => t(`signup.${row.signupMethod}`)),
    sortable('email', (row) => maskEmail(row.email)),
    { id: 'accountStatus', header: t('fields.accountStatus'), accessorFn: (row) => t(`accountStatus.${row.accountStatus}`) },
    sortable('joinedAt', (row) => formatMemberInstant(row.joinedAt)),
    sortable('lastAccessedAt', (row) => formatMemberInstant(row.lastAccessedAt)),
    sortable('withdrawnAt', (row) => formatMemberInstant(row.withdrawnAt)),
  ];
}
