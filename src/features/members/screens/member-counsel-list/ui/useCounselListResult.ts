import { useTranslation } from 'react-i18next';
import type { CounselOption, CounselRow } from '@/features/members/model/member-records';
import { listViewControls } from '@/shared/lib/list-view';
import { usePageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { CounselListView } from '../model/counsel-list-search';
import { counselListColumns } from './counsel-list-columns';

/** 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. */
export function useCounselListResult({
  search,
  rows,
  totalPages,
  inquiryOptions,
  commit,
}: {
  readonly search: CounselListView;
  readonly rows: readonly CounselRow[];
  readonly totalPages: number;
  readonly inquiryOptions: readonly CounselOption[];
  readonly commit: (next: CounselListView) => void;
}) {
  const { t } = useTranslation('members');
  const selection = usePageRowSelection({ rows, getId: (row) => row.id, resetKey: JSON.stringify(search) });
  const view = listViewControls({ search, totalPages, commit });
  return {
    selection,
    view,
    columns: counselListColumns({ t, search, selection, inquiryOptions, onHeaderSort: view.sort.onHeaderSort }),
  };
}
