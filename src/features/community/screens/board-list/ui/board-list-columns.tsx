import type { TFunction } from 'i18next';
import type { BoardRow, BoardSortKey } from '@/features/community/model/board';
import { formatDate } from '@/shared/lib/datetime';
import { headerSortDirection } from '@/shared/lib/list-sort';
import { descendingRowNumber } from '@/shared/lib/list-view';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { Button } from '@/shared/ui/primitives/Button';
import type { BoardListView } from '../model/board-list-search';

type BoardColumns = DataTableProps<BoardRow>['columns'];
/**
 * 원장 12행의 컬럼 구성이다. 행 checkbox 는 없다(2026-09-10 사용자 확정).
 * `No.` 는 전체 건수에서 내려가는 번호다(LIST-ROW-NUMBER).
 * 정렬 가능한 컬럼은 원장 13행의 7개와 같은 집합이며 활성 컬럼에만 방향이 붙는다.
 *
 * `권한` 은 원장이 쓰기/읽기 두 값을 한 컬럼으로 적었지만 정렬 키는 하나(`permission`)다.
 * 값이 둘이므로 셀을 둘로 나누고 정렬은 쓰기 컬럼에만 건다. CSS 병합은 이 저장소의 범위 밖이다.
 *
 * `게시물` 셀은 원장이 link 셀 `조회` 로 적는다. 목적지는 그 게시판으로 좁힌 게시물 목록이고,
 * navigate 는 route 가 넣는다. 행 클릭(조회 화면 이동)과 섞이지 않도록 셀 안의 버튼으로 그린다 —
 * `DataTable` 은 버튼 위 클릭을 행 활성화로 보지 않는다.
 */
export function boardListColumns({
  t,
  search,
  total,
  onHeaderSort,
  onViewPosts,
}: {
  readonly t: TFunction<'community'>;
  readonly search: BoardListView;
  readonly total: number;
  readonly onHeaderSort: (key: BoardSortKey) => void;
  readonly onViewPosts: (boardId: string) => void;
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
      cell: (context: { row: { index: number } }) => descendingRowNumber(search, total, context.row.index),
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
      cell: ({ row }: { row: { original: BoardRow } }) => (
        <Button
          type="button"
          className="bg-white text-neutral-900 underline ring-1 ring-neutral-300"
          onClick={() => onViewPosts(row.original.id)}
        >
          {t('board.columns.postsView')}
        </Button>
      ),
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
