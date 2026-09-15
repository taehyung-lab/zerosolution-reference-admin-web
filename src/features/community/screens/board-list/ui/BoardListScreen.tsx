import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { resolveBoardListSearch } from '../model/board-list-search';
import type { BoardListSearch } from '../model/board-list-search';
import { useBoardListData } from '../model/useBoardListData';
import { useBoardListFilter } from '../model/useBoardListFilter';
import { BoardListFilters } from './BoardListFilters';
import { BoardListResult } from './BoardListResult';
import { useBoardListResult } from './useBoardListResult';

/**
 * 9.1 게시판 목록. 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 를 넘기고 화면 경계에서 한 번 해소한다.
 * 모든 전이는 `onSearchChange` 한 곳으로 나간다.
 */
export function BoardListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
  onCreate,
}: {
  readonly search: BoardListSearch;
  readonly onSearchChange: (next: BoardListSearch) => void;
  readonly onActivate: (boardId: string) => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('community');
  const search = resolveBoardListSearch(sparse);
  const filter = useBoardListFilter(search, onSearchChange);
  const { rows, total, totalPages, searched, isPending, isFetching, isError, trace, retry } =
    useBoardListData(search);
  const result = useBoardListResult(search, totalPages, onSearchChange);

  return (
    <section>
      <PageHeader
        breadcrumbs={[t('board.breadcrumb.community'), t('board.breadcrumb.boards')]}
        title={t('board.title')}
      />
      <BoardListFilters filter={filter} />
      <BoardListResult
        data={{ rows, searched, isPending, isFetching, isError, trace, retry }}
        total={total}
        result={result}
        onActivate={onActivate}
        onCreate={onCreate}
      />
    </section>
  );
}
