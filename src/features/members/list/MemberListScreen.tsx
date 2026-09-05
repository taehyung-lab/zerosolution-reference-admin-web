import { MemberListActions } from './MemberListActions';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { Tooltip } from '@/shared/ui/primitives/Tooltip';
import { useTranslation } from 'react-i18next';
import {
  memberListDefinitions,
  type MemberListDefinition,
} from './member-list-definition';
import { MemberListFilters } from './MemberListFilters';
import { MemberListResult } from './MemberListResult';
import { resolveMemberSearch, type MemberRouteSearch } from './search-schema';
import { useMemberListData } from './useMemberListData';
import { useMemberListFilter } from './useMemberListFilter';
import { useMemberListResult } from './useMemberListResult';

export interface MemberListScreenProps {
  readonly search: MemberRouteSearch;
  readonly onSearchChange: (next: MemberRouteSearch) => void;
  readonly onMemberActivate: (memberId: string) => void;
  readonly onRegister: () => void;
}

export function AllMemberListScreen(props: MemberListScreenProps) {
  return <MemberListScreen definition={memberListDefinitions.all} {...props} />;
}

export function GeneralMemberListScreen(props: MemberListScreenProps) {
  return <MemberListScreen definition={memberListDefinitions.general} {...props} />;
}

export function FlaggedMemberListScreen(props: MemberListScreenProps) {
  return <MemberListScreen definition={memberListDefinitions.flagged} {...props} />;
}

function MemberListScreen({
  definition,
  search,
  onSearchChange,
  onMemberActivate,
  onRegister,
}: MemberListScreenProps & { readonly definition: MemberListDefinition }) {
  const { t } = useTranslation('members');
  const filter = useMemberListFilter({ search, onSearchChange });
  const data = useMemberListData(search);
  const result = useMemberListResult({
    search: resolveMemberSearch(search),
    data,
    definition,
    onSearchChange,
  });
  const title = t(definition.titleKey);

  /**
   * The request boundary. Everything above assembles a `MemberListActionRequest`; this is the
   * only place that would send it, and today it sends nothing.
   *
   * TRANSPLANT_PENDING_MEMBER_LIST_ACTIONS: there is no member contract, so no mutation exists
   * to call. When one does, this becomes the shape `features/managers` already uses — the
   * options live in `features/members/api/mutations.ts` and only this function changes:
   *
   *   const bulkChange = useMutation(memberBulkChangeMutation());
   *   const onActionRequest = (request: MemberListActionRequest) => {
   *     if (request.type === 'bulkChange') void bulkChange.mutateAsync(request);
   *   };
   *
   * The message channels open a composer instead of a request, so they stay separate.
   * Success handling and cache consequence are outside this repository (AGENTS.md §4).
   */
  const onActionRequest = () => undefined;

  return (
    <section>
      <PageHeader
        breadcrumb={t('breadcrumb', { title })}
        title={title}
        actions={
          definition.tooltip ? (
            <Tooltip content={t('screens.allTooltip')}>
              <button aria-label={t('screens.help')} className="rounded-full" type="button">
                ⓘ
              </button>
            </Tooltip>
          ) : undefined
        }
      />
      <MemberListFilters filter={filter} definition={definition} />
      <MemberListResult
        data={data}
        result={result}
        toolbarRight={
          <MemberListActions
            searched={data.searched}
            selectedIds={result.selectedIds}
            onActionRequest={onActionRequest}
            onRegister={onRegister}
          />
        }
        onMemberActivate={onMemberActivate}
      />
    </section>
  );
}
