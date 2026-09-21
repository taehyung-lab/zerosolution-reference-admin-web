import { useTranslation } from 'react-i18next';
import type { MemberProfile } from '@/features/members/model/member';
import { listViewControls } from '@/shared/lib/list-view';
import { usePageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { MemberListDefinition } from '../model/member-list-definition';
import type { MemberListView } from '../model/member-list-search';
import { memberListColumns } from './member-list-columns';

/**
 * 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다.
 * 선택은 확정된 한 화면(committed search)의 현재 페이지에 한정된다.
 */
export function useMemberListResult({
  search,
  definition,
  rows,
  totalPages,
  commit,
}: {
  readonly search: MemberListView;
  readonly definition: MemberListDefinition;
  readonly rows: readonly MemberProfile[];
  readonly totalPages: number;
  readonly commit: (next: MemberListView) => void;
}) {
  const { t } = useTranslation('members');
  const selection = usePageRowSelection({ rows, getId: (row) => row.id, resetKey: JSON.stringify(search) });
  const view = listViewControls({ search, totalPages, commit });

  return {
    selection,
    view,
    columns: memberListColumns({ t, search, definition, selection, onHeaderSort: view.sort.onHeaderSort }),
  };
}
