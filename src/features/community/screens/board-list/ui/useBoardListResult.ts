import { useTranslation } from 'react-i18next';
import { listViewControls } from '@/shared/lib/list-view';
import type { BoardListView } from '../model/board-list-search';
import { boardListColumns } from './board-list-columns';

/** 결과 영역이 그대로 렌더할 보기 컨트롤과 컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다. */
export function useBoardListResult({
  search,
  total,
  totalPages,
  commit,
  onViewPosts,
}: {
  readonly search: BoardListView;
  readonly total: number;
  readonly totalPages: number;
  readonly commit: (next: BoardListView) => void;
  readonly onViewPosts: (boardId: string) => void;
}) {
  const { t } = useTranslation('community');
  const view = listViewControls({ search, totalPages, commit });

  return {
    view,
    columns: boardListColumns({
      t,
      search,
      total,
      onHeaderSort: view.sort.onHeaderSort,
      onViewPosts,
    }),
  };
}
