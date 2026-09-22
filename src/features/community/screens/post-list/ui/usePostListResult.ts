import { useTranslation } from 'react-i18next';
import type { PostRow } from '@/features/community/model/post';
import { listViewControls } from '@/shared/lib/list-view';
import { usePageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { PostListView } from '../model/post-list-search';
import { postListColumns } from './post-list-columns';

/**
 * 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다.
 * 선택은 확정된 한 화면(committed search)의 현재 페이지에 한정되고, 검색이 바뀌면 사라진다.
 */
export function usePostListResult({
  search,
  rows,
  totalPages,
  commit,
}: {
  readonly search: PostListView;
  readonly rows: readonly PostRow[];
  readonly totalPages: number;
  readonly commit: (next: PostListView) => void;
}) {
  const { t } = useTranslation('community');
  const selection = usePageRowSelection({
    rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const view = listViewControls({ search, totalPages, commit });

  return {
    selection,
    view,
    columns: postListColumns({ t, search, selection, onHeaderSort: view.sort.onHeaderSort }),
  };
}
