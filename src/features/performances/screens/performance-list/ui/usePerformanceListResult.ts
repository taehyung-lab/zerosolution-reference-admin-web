import { useTranslation } from 'react-i18next';
import { listViewControls } from '@/shared/lib/list-view';
import type { PerformanceListView } from '../model/performance-list-search';
import { performanceListColumns } from './performance-list-columns';

/** 결과 영역이 그대로 렌더할 보기 컨트롤과 컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다. 행 선택은 없다. */
export function usePerformanceListResult({
  search,
  total,
  totalPages,
  commit,
}: {
  readonly search: PerformanceListView;
  readonly total: number;
  readonly totalPages: number;
  readonly commit: (next: PerformanceListView) => void;
}) {
  const { t } = useTranslation('performances');
  const view = listViewControls({ search, totalPages, commit });

  return {
    view,
    columns: performanceListColumns({ t, search, total, onHeaderSort: view.sort.onHeaderSort }),
  };
}
