import { useTranslation } from 'react-i18next';
import type { ContentRow } from '@/features/performances/model/content';
import { listViewControls } from '@/shared/lib/list-view';
import { usePageRowSelection } from '@/shared/model/use-page-row-selection';
import type { ContentListView } from '../model/content-list-search';
import { contentListColumns } from './content-list-columns';

/**
 * 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다.
 * 선택은 확정된 한 화면(committed search)의 현재 페이지에 한정된다.
 */
export function useContentListResult({
  search,
  rows,
  totalPages,
  commit,
  onPreview,
}: {
  readonly search: ContentListView;
  readonly rows: readonly ContentRow[];
  readonly totalPages: number;
  readonly commit: (next: ContentListView) => void;
  readonly onPreview: (row: ContentRow) => void;
}) {
  const { t } = useTranslation('performances');
  const selection = usePageRowSelection({ rows, getId: (row) => row.id, resetKey: JSON.stringify(search) });
  const view = listViewControls({ search, totalPages, commit });

  return {
    selection,
    view,
    columns: contentListColumns({ t, search, selection, onHeaderSort: view.sort.onHeaderSort, onPreview }),
  };
}
