import type { TFunction } from 'i18next';
import type { BoardRow, BoardSortKey } from '@/features/community/model/board';
import { formatDate } from '@/shared/lib/datetime';
import { headerSortDirection } from '@/shared/lib/list-sort';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import type { BoardListView } from '../model/board-list-search';

type BoardColumns = DataTableProps<BoardRow>['columns'];
/**
 * 원장 12행의 컬럼 구성이다. 행 checkbox 는 없다(2026-09-10 사용자 확정).
 * 정렬 가능한 컬럼은 원장 13행의 7개와 같은 집합이며 활성 컬럼에만 방향이 붙는다.
 *
 * `권한` 은 원장이 쓰기/읽기 두 값을 한 컬럼으로 적었지만 정렬 키는 하나(`permission`)다.
 * 값이 둘이므로 셀을 둘로 나누고 정렬은 쓰기 컬럼에만 건다. CSS 병합은 이 저장소의 범위 밖이다.
 *
 * `게시물` 셀은 원장이 link 셀 `조회` 로 적지만 게시물 목록 route 가 이 저장소에 없어
 * 이동을 걸지 않는다(차단된 요구사항 R13). 목적지가 생기면 이 셀만 Link 로 바꾼다.
 */
export function boardListColumns({
  t,
  search,
  offset,
  onHeaderSort,
}: {
  readonly t: TFunction<'community'>;
  readonly search: BoardListView;
  readonly offset: number;
  readonly onHeaderSort: (key: BoardSortKey) => void;
}): BoardColumns {
  const active = { type: search.sortType, direction: search.sortDirection };
  const sortMeta = (key: BoardSortKey) => ({
    sort: {
      direction: headerSortDirection(active, key),
      onSort: () => onHeaderSort(key),
    },
  });

  return [
    {
      id: 'no',
      header: t('board.columns.no'),
      cell: (context: { row: { index: number } }) => offset + context.row.index + 1,
    },
    {
      id: 'type',
      header: t('board.columns.type'),
      accessorFn: (row: BoardRow) => t(`board.values.type.${row.type}`),
      meta: sortMeta('type'),
    },
    {
      id: 'category',
      header: t('board.columns.category'),
      accessorFn: (row: BoardRow) => t(`board.values.category.${row.category}`),
      meta: sortMeta('category'),
    },
    {
      id: 'name',
      header: t('board.columns.name'),
      accessorKey: 'name',
      meta: sortMeta('name'),
    },
    {
      id: 'writePermission',
      header: t('board.columns.writePermission'),
      accessorFn: (row: BoardRow) => t(`board.values.permission.${row.writePermission}`),
      meta: sortMeta('permission'),
    },
    {
      id: 'readPermission',
      header: t('board.columns.readPermission'),
      accessorFn: (row: BoardRow) => t(`board.values.permission.${row.readPermission}`),
    },
    {
      id: 'postCount',
      header: t('board.columns.postCount'),
      accessorKey: 'postCount',
      meta: sortMeta('postCount'),
    },
    {
      id: 'posts',
      header: t('board.columns.posts'),
      accessorFn: () => t('board.columns.postsView'),
    },
    {
      id: 'usage',
      header: t('board.columns.usage'),
      accessorFn: (row: BoardRow) => t(`board.values.usage.${row.usage}`),
    },
    {
      id: 'registeredAt',
      header: t('board.columns.registeredAt'),
      accessorFn: (row: BoardRow) => formatDate(row.registeredAt),
      meta: sortMeta('registeredAt'),
    },
    {
      id: 'updatedAt',
      header: t('board.columns.updatedAt'),
      accessorFn: (row: BoardRow) => formatDate(row.updatedAt),
      meta: sortMeta('updatedAt'),
    },
  ];
}
