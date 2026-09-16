import { useTranslation } from 'react-i18next';
import { listViewControls } from '@/shared/lib/list-view';
import type { BoardListView } from '../model/board-list-search';
import { boardListColumns } from './board-list-columns';

/** 결과 영역이 그대로 렌더할 보기 컨트롤과 컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다. */
export function useBoardListResult({
  search,
  totalPages,
  commit,
}: {
  readonly search: BoardListView;
  readonly totalPages: number;
  readonly commit: (next: BoardListView) => void;
}) {
  const { t } = useTranslation('community');
  const view = listViewControls({ search, totalPages, commit });

  return {
    view,
    columns: boardListColumns({
      t,
      search,
      offset: (search.page - 1) * search.pageSize,
      onHeaderSort: view.sort.onHeaderSort,
    }),
  };
}
