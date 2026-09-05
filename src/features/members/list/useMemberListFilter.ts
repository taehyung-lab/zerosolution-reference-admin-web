import { useDraftCommit } from '@/shared/lib/use-draft-commit';
import { useKeywordDraft } from '@/shared/lib/use-keyword-draft';
import { usePeriodDraft } from '@/shared/lib/use-period-draft';
import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  resolveMemberSearch,
  toMemberRouteSearch,
  type MemberRouteSearch,
  type MemberSearch,
} from './search-schema';

const filterKey = (search: MemberRouteSearch) =>
  JSON.stringify({
    periodType: search.periodType,
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
    keywords: search.keywords,
    signupMethods: search.signupMethods,
    accountStatuses: search.accountStatuses,
    restrictions: search.restrictions,
  });

export function useMemberListFilter({
  search,
  onSearchChange,
}: {
  readonly search: MemberRouteSearch;
  readonly onSearchChange: (next: MemberRouteSearch) => void;
}) {
  const { t } = useTranslation('members');
  const resetKey = filterKey(search);
  const { draft, patchDraft, resetDraft } = useDraftCommit({
    committed: search,
    keyOf: filterKey,
    createDraft: resolveMemberSearch,
  });
  const period = usePeriodDraft({ committed: resolveMemberSearch(search), resetKey });
  const keyword = useKeywordDraft({
    committedItems: resolveMemberSearch(search).keywords,
    initialField: 'email' as const,
    resetKey,
  });
  const [periodError, setPeriodError] = useState(false);
  const [keywordError, setKeywordError] = useState(false);

  const hasDuplicatePendingField = () =>
    keyword.pending.value.trim() !== '' &&
    keyword.items.some((item) => item.field === keyword.pending.field);

  const addKeyword = () => {
    if (hasDuplicatePendingField()) {
      setKeywordError(true);
      return;
    }
    setKeywordError(false);
    keyword.addPending();
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ordered =
      period.range.from === undefined ||
      period.range.to === undefined ||
      period.range.from <= period.range.to;
    if (!ordered) {
      setPeriodError(true);
      return;
    }
    if (hasDuplicatePendingField()) {
      setKeywordError(true);
      return;
    }
    setPeriodError(false);
    setKeywordError(false);
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
    setPeriodError(false);
    setKeywordError(false);
    onSearchChange({});
  };

  return {
    draft,
    patchDraft,
    period,
    periodError: periodError ? t('filters.periodRangeOrderError') : undefined,
    keyword,
    keywordError: keywordError ? t('filters.duplicateKeywordTarget') : undefined,
    addKeyword,
    submit,
    reset,
  };
}
