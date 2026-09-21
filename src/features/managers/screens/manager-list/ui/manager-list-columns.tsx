import type { TFunction } from 'i18next';
import type { ManagerRow, ManagerSortKey } from '@/features/managers/model/manager';
import { formatDate } from '@/shared/lib/datetime';
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact';
import { headerSortDirection } from '@/shared/lib/list-sort';
import type { PageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { ManagerListView } from '../model/manager-list-search';

/**
 * Figma 11.1 table 의 컬럼 순서다. 정렬 가능한 컬럼 집합은 정렬 키와 같은 타입에서 나오므로 보기 정렬
 * 목록과 헤더가 갈라지지 않는다. 방향 표시는 활성 컬럼 하나에만 준다(aria-sort 한 개).
 */
const columnOrder: readonly ManagerSortKey[] = [
  'type',
  'organization',
  'id',
  'name',
  'phone',
  'email',
  'permission',
  'registrationRoute',
  'accountStatus',
  'joinedAt',
  'lastAccessAt',
];

export function managerListColumns({
  t,
  search,
  selection,
  onHeaderSort,
}: {
  readonly t: TFunction<'managers'>;
  readonly search: ManagerListView;
  readonly selection: PageRowSelection<ManagerRow>;
  readonly onHeaderSort: (key: ManagerSortKey) => void;
}): DataTableProps<ManagerRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const cell = (row: ManagerRow, field: ManagerSortKey): string => {
    if (field === 'accountStatus') return t(`accountStatus.${row.accountStatus}`);
    if (field === 'joinedAt' || field === 'lastAccessAt') return formatDate(row[field]);
    // 연락처는 마스킹해 보인다. 해제는 조회의 재인증 액션뿐이다(CONTACT-MASKING).
    if (field === 'phone') return maskPhone(row.phone);
    if (field === 'email') return maskEmail(row.email);
    return row[field];
  };

  return [
    selectionColumn({
      selection,
      pageLabel: t('result.selectAll'),
      rowLabel: (row) => t('result.selectRow', { id: row.id }),
    }),
    ...columnOrder.map((field) => ({
      id: field,
      header: t(`fields.${field}`),
      accessorFn: (row: ManagerRow) => cell(row, field),
      meta: {
        sort: { direction: headerSortDirection(active, field), onSort: () => onHeaderSort(field) },
      },
    })),
  ];
}
