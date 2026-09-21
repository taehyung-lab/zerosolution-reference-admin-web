import type { TFunction } from 'i18next';
import { formatMemberInstant } from '@/features/members/lib/format-member-instant';
import type { MemberProfile, MemberSortKey } from '@/features/members/model/member';
import { headerSortDirection } from '@/shared/lib/list-sort';
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact';
import type { PageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { MemberListDefinition } from '../model/member-list-definition';
import type { MemberListView } from '../model/member-list-search';

type Column = DataTableProps<MemberProfile>['columns'][number];

/**
 * Figma 4.1 table 의 컬럼 순서. 정렬 가능한 컬럼은 정렬 키와 같은 타입에서 나오고 방향 표시는 활성 컬럼 하나에만
 * 준다(aria-sort 한 개). 연락처는 마스킹된 표시값이다. 불량회원 화면만 활동제한 컬럼을 더한다.
 * TRANSPLANT_PENDING_MEMBER_GRADE: 등급은 확인된 계약이 없어 자리표시자다.
 */
export function memberListColumns({
  t,
  search,
  definition,
  selection,
  onHeaderSort,
}: {
  readonly t: TFunction<'members'>;
  readonly search: MemberListView;
  readonly definition: MemberListDefinition;
  readonly selection: PageRowSelection<MemberProfile>;
  readonly onHeaderSort: (key: MemberSortKey) => void;
}): DataTableProps<MemberProfile>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const sortable = (key: MemberSortKey, accessorFn: (row: MemberProfile) => string): Column => ({
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
    { id: 'grade', header: t('fields.grade'), accessorFn: () => '—' },
    sortable('signupMethod', (row) => t(`signup.${row.signupMethod}`)),
    sortable('email', (row) => maskEmail(row.email)),
    sortable('name', (row) => row.name),
    sortable('phone', (row) => maskPhone(row.phone)),
    { id: 'accountStatus', header: t('fields.accountStatus'), accessorFn: (row) => t(`accountStatus.${row.accountStatus}`) },
    sortable('joinedAt', (row) => formatMemberInstant(row.joinedAt)),
    sortable('lastAccessedAt', (row) => formatMemberInstant(row.lastAccessedAt)),
    ...(definition.restrictionColumn
      ? [
          {
            id: 'restrictions',
            header: t('fields.restrictions'),
            accessorFn: (row: MemberProfile) => row.restrictions.map((value) => t(`restriction.${value}`)).join(', '),
          } satisfies Column,
        ]
      : []),
  ];
}
