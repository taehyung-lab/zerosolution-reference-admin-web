import type { TFunction } from 'i18next';
import { formatMemberInstant } from '@/features/members/lib/format-member-instant';
import type { DormantMemberRow, DormantSortKey } from '@/features/members/model/member-records';
import { headerSortDirection } from '@/shared/lib/list-sort';
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact';
import type { PageRowSelection } from '@/shared/model/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { DormantListView } from '../model/dormant-list-search';

type Column = DataTableProps<DormantMemberRow>['columns'][number];

/** Figma 4.3 table 의 컬럼 순서. 계정 상태는 표시만 하고 나머지는 정렬 키와 같은 집합이다. */
export function dormantListColumns({
  t,
  search,
  selection,
  onHeaderSort,
}: {
  readonly t: TFunction<'members'>;
  readonly search: DormantListView;
  readonly selection: PageRowSelection<DormantMemberRow>;
  readonly onHeaderSort: (key: DormantSortKey) => void;
}): DataTableProps<DormantMemberRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const sortable = (key: DormantSortKey, accessorFn: (row: DormantMemberRow) => string): Column => ({
    id: key,
    header: t(`fields.${key}`),
    accessorFn,
    meta: { sort: { direction: headerSortDirection(active, key), onSort: () => onHeaderSort(key) } },
  });

  return [
    selectionColumn({
      selection,
      pageLabel: t('result.selectPage'),
      rowLabel: (row) => t('result.selectRow', { name: row.name }),
    }),
    sortable('signupMethod', (row) => t(`signup.${row.signupMethod}`)),
    sortable('email', (row) => maskEmail(row.email)),
    sortable('name', (row) => row.name),
    sortable('phone', (row) => maskPhone(row.phone)),
    { id: 'accountStatus', header: t('fields.accountStatus'), accessorFn: (row) => t(`accountStatus.${row.accountStatus}`) },
    sortable('joinedAt', (row) => formatMemberInstant(row.joinedAt)),
    sortable('lastAccessedAt', (row) => formatMemberInstant(row.lastAccessedAt)),
    sortable('dormantAt', (row) => formatMemberInstant(row.dormantAt)),
  ];
}
