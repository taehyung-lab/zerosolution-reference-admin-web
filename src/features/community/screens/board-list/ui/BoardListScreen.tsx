import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import {
  boardListSearch,
  type BoardListSearch,
  type BoardListView,
} from '../model/board-list-search';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import { standardPageSizeOptions } from '@/shared/lib/list-options';
import { Button } from '@/shared/ui/primitives/Button';
import { boardSortKeys } from '@/features/community/model/board';
import { useBoardListData } from '../model/useBoardListData';
import { useBoardListFilter } from '../model/useBoardListFilter';
import { BoardListFilters } from './BoardListFilters';
import { useBoardListResult } from './useBoardListResult';

/**
 * 9.1 게시판 목록. 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 를 넘기고 화면이 한 번 해소한다. 모든 URL 전이는 `commit` 한 곳으로
 * 나가며 canonical 로 줄여 `onSearchChange` 에 넘긴다.
 */
export function BoardListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
  onCreate,
  onViewPosts,
}: {
  readonly search: BoardListSearch;
  readonly onSearchChange: (next: BoardListSearch) => void;
  readonly onActivate: (boardId: string) => void;
  readonly onCreate: () => void;
  /** 원장 12행의 `게시물` link 셀: 그 게시판으로 좁힌 게시물 목록으로 나간다. */
  readonly onViewPosts: (boardId: string) => void;
}) {
  const { t } = useTranslation('community');
  const search = boardListSearch.resolve(sparse);
  const commit = (next: BoardListView) => onSearchChange(boardListSearch.canonical.parse(next));
  const filter = useBoardListFilter(search, commit);
  const { rows, total, totalPages, ...data } = useBoardListData(search);
  const result = useBoardListResult({ search, totalPages, commit, onViewPosts });

  return (
    <section>
      <PageHeader
        breadcrumbs={[t('board.breadcrumb.community'), t('board.breadcrumb.boards')]}
        title={t('board.title')}
      />
      <BoardListFilters filter={filter} />
      <PagedListResult
        data={{ rows, ...data }}
        total={total}
        view={result.view}
        columns={result.columns}
        getRowId={(row) => row.id}
        onRowActivate={(row) => onActivate(row.id)}
        actions={<Button onClick={onCreate}>{t('board.result.create')}</Button>}
        copy={{ empty: t('board.result.empty') }}
        pageSizeOptions={standardPageSizeOptions}
        sortOptions={boardSortKeys.map((value) => ({ value, label: t(`board.sort.${value}`) }))}
      />
    </section>
  );
}
