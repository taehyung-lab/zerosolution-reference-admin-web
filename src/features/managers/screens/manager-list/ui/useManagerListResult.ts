import { useTranslation } from 'react-i18next';
import type { ManagerRow } from '@/features/managers/model/manager';
import { listViewControls } from '@/shared/lib/list-view';
import { usePageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { ManagerListView } from '../model/manager-list-search';
import { managerListColumns } from './manager-list-columns';

/**
 * 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다.
 * 선택은 확정된 한 화면(committed search)의 현재 페이지에 한정된다.
 */
export function useManagerListResult({
  search,
  rows,
  totalPages,
  commit,
}: {
  readonly search: ManagerListView;
  readonly rows: readonly ManagerRow[];
  readonly totalPages: number;
  readonly commit: (next: ManagerListView) => void;
}) {
  const { t } = useTranslation('managers');
  const selection = usePageRowSelection({
    rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const view = listViewControls({ search, totalPages, commit });

  return {
    selection,
    view,
    columns: managerListColumns({ t, search, selection, onHeaderSort: view.sort.onHeaderSort }),
  };
}
