import { useTranslation } from 'react-i18next';
import type { WithdrawnMemberRow } from '@/features/members/model/member-records';
import { listViewControls } from '@/shared/lib/list-view';
import { usePageRowSelection } from '@/shared/model/use-page-row-selection';
import type { WithdrawnListView } from '../model/withdrawn-list-search';
import { withdrawnListColumns } from './withdrawn-list-columns';

/** 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다. */
export function useWithdrawnListResult({
  search,
  rows,
  totalPages,
  commit,
}: {
  readonly search: WithdrawnListView;
  readonly rows: readonly WithdrawnMemberRow[];
  readonly totalPages: number;
  readonly commit: (next: WithdrawnListView) => void;
}) {
  const { t } = useTranslation('members');
  const selection = usePageRowSelection({ rows, getId: (row) => row.id, resetKey: JSON.stringify(search) });
  const view = listViewControls({ search, totalPages, commit });
  return { selection, view, columns: withdrawnListColumns({ t, search, selection, onHeaderSort: view.sort.onHeaderSort }) };
}
