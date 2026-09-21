import { useTranslation } from 'react-i18next';
import type { MemberAccessRow } from '@/features/members/model/member-records';
import { listViewControls } from '@/shared/lib/list-view';
import { usePageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { AccessListView } from '../model/access-list-search';
import { accessListColumns } from './access-list-columns';

/** 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. */
export function useAccessListResult({
  search,
  rows,
  totalPages,
  commit,
}: {
  readonly search: AccessListView;
  readonly rows: readonly MemberAccessRow[];
  readonly totalPages: number;
  readonly commit: (next: AccessListView) => void;
}) {
  const { t } = useTranslation('members');
  const selection = usePageRowSelection({ rows, getId: (row) => row.id, resetKey: JSON.stringify(search) });
  const view = listViewControls({ search, totalPages, commit });
  return { selection, view, columns: accessListColumns({ t, search, selection, onHeaderSort: view.sort.onHeaderSort }) };
}
