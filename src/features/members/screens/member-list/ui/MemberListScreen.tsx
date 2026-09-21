import { useTranslation } from 'react-i18next';
import type { MemberMessageChannel } from '@/features/members/model/member';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import type { MemberListDefinition } from '../model/member-list-definition';
import { memberListSearch, type MemberListSearch, type MemberListView } from '../model/member-list-search';
import { useMemberListData } from '../model/useMemberListData';
import { useMemberListFilter } from '../model/useMemberListFilter';
import { MemberListActions } from './MemberListActions';
import { MemberListFilters } from './MemberListFilters';
import { useMemberListResult } from './useMemberListResult';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import { standardPageSizeOptions } from '@/shared/lib/list-options';
import { memberSortKeys } from '@/features/members/model/member';

/**
 * 4.1 활성 회원 목록(전체·일반·불량). 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 와 화면 정의를 넘기고 화면이 한 번 해소한다. 모든 URL 전이는 `commit` 한 곳으로
 * 나가며 canonical 로 줄여 `onSearchChange` 에 넘긴다. 검색 전(`searched` 없음)에는 조회하지 않는다.
 * SMS·이메일 작성은 다른 도메인이라 route 가 조립하고 이 화면은 채널과 대상만 알린다.
 */
export function MemberListScreen({
  definition,
  search: sparse,
  onSearchChange,
  onActivate,
  onCreate,
  onMessage,
}: {
  readonly definition: MemberListDefinition;
  readonly search: MemberListSearch;
  readonly onSearchChange: (next: MemberListSearch) => void;
  readonly onActivate: (memberId: string) => void;
  readonly onCreate: () => void;
  readonly onMessage: (channel: MemberMessageChannel, ids: readonly string[]) => void;
}) {
  const { t } = useTranslation('members');
  const search = memberListSearch.resolve(sparse);
  const commit = (next: MemberListView) => onSearchChange(memberListSearch.canonical.parse(next));
  const filter = useMemberListFilter(search, commit);
  const { rows, total, totalPages, ...data } = useMemberListData(search, definition);
  const result = useMemberListResult({ search, definition, rows, totalPages, commit });
  const title = t(definition.titleKey);

  return (
    <section>
      <PageHeader
        title={title}
        breadcrumbs={[t('path.members'), t('path.active'), title]}
        tooltip={definition.tooltip ? { content: t('screens.allTooltip'), label: t('screens.help') } : undefined}
      />
      <MemberListFilters filter={filter} definition={definition} />
<PagedListResult
        data={{ rows, ...data }}
        total={total}
        view={result.view}
        columns={result.columns}
        getRowId={(row) => row.id}
        onRowActivate={(row) => onActivate(row.id)}
        actions={
          <MemberListActions
            searched={search.searched}
            selectedIds={result.selection.selectedIds}
            onCreate={onCreate}
            onMessage={onMessage}
          />
        }
        copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
        pageSizeOptions={standardPageSizeOptions}
        sortOptions={memberSortKeys.map((value) => ({ value, label: t(`fields.${value}`) }))}
      />
    </section>
  );
}
