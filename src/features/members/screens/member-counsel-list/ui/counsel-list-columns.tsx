import type { TFunction } from 'i18next';
import { formatMemberInstant } from '@/features/members/lib/format-member-instant';
import type { CounselOption, CounselRow, CounselSortKey } from '@/features/members/model/member-records';
import { headerSortDirection } from '@/shared/lib/list-sort';
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact';
import type { PageRowSelection } from '@/shared/model/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { CounselListView } from '../model/counsel-list-search';

type Column = DataTableProps<CounselRow>['columns'][number];

/** Figma 4.6 table 의 컬럼 순서. 문의유형은 서버 옵션의 라벨로 보이고, 옵션이 없으면 식별자를 그대로 둔다. */
export function counselListColumns({
  t,
  search,
  selection,
  inquiryOptions,
  onHeaderSort,
}: {
  readonly t: TFunction<'members'>;
  readonly search: CounselListView;
  readonly selection: PageRowSelection<CounselRow>;
  readonly inquiryOptions: readonly CounselOption[];
  readonly onHeaderSort: (key: CounselSortKey) => void;
}): DataTableProps<CounselRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const sortable = (key: CounselSortKey, accessorFn: (row: CounselRow) => string): Column => ({
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
    sortable('email', (row) => maskEmail(row.email)),
    sortable('name', (row) => row.name),
    sortable('phone', (row) => maskPhone(row.phone)),
    sortable(
      'inquiryType',
      (row) => inquiryOptions.find((option) => option.value === row.inquiryType)?.label ?? row.inquiryType,
    ),
    sortable('content', (row) => row.content),
    sortable('receivedAt', (row) => formatMemberInstant(row.receivedAt)),
    sortable('status', (row) => t(`states.${row.status}`)),
    sortable('answeredAt', (row) => formatMemberInstant(row.answeredAt)),
  ];
}
