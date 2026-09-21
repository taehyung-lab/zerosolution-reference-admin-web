import { useTranslation } from 'react-i18next';
import type { DormantMemberRow } from '@/features/members/model/member-records';
import { listViewControls } from '@/shared/lib/list-view';
import { usePageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { DormantListView } from '../model/dormant-list-search';
import { dormantListColumns } from './dormant-list-columns';

/** 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다. */
export function useDormantListResult({
  search,
  rows,
  totalPages,
  commit,
}: {
  readonly search: DormantListView;
  readonly rows: readonly DormantMemberRow[];
  readonly totalPages: number;
  readonly commit: (next: DormantListView) => void;
}) {
  const { t } = useTranslation('members');
  const selection = usePageRowSelection({ rows, getId: (row) => row.id, resetKey: JSON.stringify(search) });
  const view = listViewControls({ search, totalPages, commit });
  return { selection, view, columns: dormantListColumns({ t, search, selection, onHeaderSort: view.sort.onHeaderSort }) };
}
