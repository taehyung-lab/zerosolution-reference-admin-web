import { filterPartitionKey, filterPartitionValues } from '@/shared/lib/search-partition';
import { useDraftCommit } from '@/shared/lib/use-draft-commit';
import { useKeywordDraft } from '@/shared/lib/use-keyword-draft';
import { usePeriodDraft } from '@/shared/lib/use-period-draft';
import { type SubmitEvent } from 'react';
import {
  memberSearchPartition,
  resolveMemberSearch,
  toMemberRouteSearch,
  type MemberRouteSearch,
  type MemberSearch,
} from './search-schema';

const filterKey = (search: MemberRouteSearch) =>
  filterPartitionKey(search, memberSearchPartition);

export function useMemberListFilter({
  search,
  onSearchChange,
}: {
  readonly search: MemberRouteSearch;
  readonly onSearchChange: (next: MemberRouteSearch) => void;
}) {
  const resetKey = filterKey(search);
  const { draft, patchDraft, resetDraft } = useDraftCommit({
    committed: search,
    keyOf: filterKey,
    // The draft holds filter fields only, so a committed view can never be edited and discarded.
    createDraft: (value) => filterPartitionValues(resolveMemberSearch(value), memberSearchPartition),
  });
  const period = usePeriodDraft({ committed: resolveMemberSearch(search), resetKey });
  const keyword = useKeywordDraft({
    committedItems: resolveMemberSearch(search).keywords,
    initialField: 'email' as const,
    resetKey,
  });
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: MemberSearch = {
      ...resolveMemberSearch(search),
      ...draft,
      ...period.utcRange,
      keywords: keyword.itemsIncludingPending(),
      page: 1,
    };
    onSearchChange(toMemberRouteSearch(next));
  };

  const reset = () => {
    resetDraft();
    period.reset();
    keyword.reset();
    onSearchChange({});
  };

  return {
    draft,
    patchDraft,
    period,
    keyword,
    addKeyword: keyword.addPending,
    submit,
    reset,
  };
}
