import type { TFunction } from 'i18next';
import { formatMemberInstant } from '@/features/members/lib/format-member-instant';
import type { AppealRow, AppealSortKey } from '@/features/members/model/member-records';
import { headerSortDirection } from '@/shared/lib/list-sort';
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact';
import type { PageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { AppealListView } from '../model/appeal-list-search';

type Column = DataTableProps<AppealRow>['columns'][number];

/** Figma 4.7 table 의 컬럼 순서. 계정 상태·처리상태·소명결과는 표시만 한다. */
export function appealListColumns({
  t,
  search,
  selection,
  onHeaderSort,
}: {
  readonly t: TFunction<'members'>;
  readonly search: AppealListView;
  readonly selection: PageRowSelection<AppealRow>;
  readonly onHeaderSort: (key: AppealSortKey) => void;
}): DataTableProps<AppealRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const sortable = (key: AppealSortKey, accessorFn: (row: AppealRow) => string): Column => ({
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
    sortable('email', (row) => maskEmail(row.email)),
    sortable('name', (row) => row.name),
    sortable('phone', (row) => maskPhone(row.phone)),
    { id: 'accountStatus', header: t('fields.accountStatus'), accessorFn: (row) => t(`accountStatus.${row.accountStatus}`) },
    sortable('restrictions', (row) => row.restrictions.map((value) => t(`restriction.${value}`)).join(', ')),
    sortable('appliedAt', (row) => formatMemberInstant(row.appliedAt)),
    sortable('flaggedAt', (row) => formatMemberInstant(row.flaggedAt)),
    { id: 'status', header: t('fields.status'), accessorFn: (row) => t(`states.${row.status}`) },
    { id: 'result', header: t('fields.result'), accessorFn: (row) => t(`states.${row.result}`) },
  ];
}
