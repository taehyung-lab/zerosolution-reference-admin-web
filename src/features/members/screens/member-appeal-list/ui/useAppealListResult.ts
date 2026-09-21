import { useTranslation } from 'react-i18next';
import type { AppealRow } from '@/features/members/model/member-records';
import { listViewControls } from '@/shared/lib/list-view';
import { usePageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { AppealListView } from '../model/appeal-list-search';
import { appealListColumns } from './appeal-list-columns';

/** 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. */
export function useAppealListResult({
  search,
  rows,
  totalPages,
  commit,
}: {
  readonly search: AppealListView;
  readonly rows: readonly AppealRow[];
  readonly totalPages: number;
  readonly commit: (next: AppealListView) => void;
}) {
  const { t } = useTranslation('members');
  const selection = usePageRowSelection({ rows, getId: (row) => row.id, resetKey: JSON.stringify(search) });
  const view = listViewControls({ search, totalPages, commit });
  return { selection, view, columns: appealListColumns({ t, search, selection, onHeaderSort: view.sort.onHeaderSort }) };
}
