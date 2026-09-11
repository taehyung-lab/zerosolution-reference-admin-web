import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import type { BoardListSearch, ResolvedBoardListSearch } from '../model/board-list-search';
import { useBoardListData } from '../model/useBoardListData';
import { useBoardListFilter } from '../model/useBoardListFilter';
import { BoardListFilters } from './BoardListFilters';
import { BoardListResult } from './BoardListResult';
import { useBoardListResult } from './useBoardListResult';

/**
 * 9.1 게시판 목록. 조립만 하고 상태는 각 소유자에 둔다.
 * URL 은 route 가 검증한 해소값으로 받고 모든 전이는 `onSearchChange` 한 곳으로 나간다.
 */
export function BoardListScreen({
  search,
  onSearchChange,
}: {
  readonly search: ResolvedBoardListSearch;
  readonly onSearchChange: (next: BoardListSearch) => void;
}) {
  const { t } = useTranslation('community');
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
      />
    </section>
  );
}
