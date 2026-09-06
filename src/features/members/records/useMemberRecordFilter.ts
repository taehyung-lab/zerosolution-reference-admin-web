import type { SubmitEvent } from "react";
import { useDraftCommit } from "@/shared/lib/use-draft-commit";
import { usePeriodDraft } from "@/shared/lib/use-period-draft";
import { useKeywordDraft } from "@/shared/lib/use-keyword-draft";
import { compactSearchValues } from "@/shared/lib/compact-search-values";
import type { MemberRecordSearch } from "./member-record-search";

const filters = (search: MemberRecordSearch) => {
  const next = { ...search };
  delete next.page;
  delete next.pageSize;
  delete next.sortType;
  delete next.sortDirection;
  return next;
};

export function useMemberRecordFilter(
  search: MemberRecordSearch,
  onSearchChange: (search: MemberRecordSearch) => void,
  defaultPeriod: string,
) {
  const { draft, patchDraft, resetDraft } = useDraftCommit({
    committed: search,
    keyOf: (value) => JSON.stringify(filters(value)),
    createDraft: (value) => ({
      ...filters(value),
      periodType: value.periodType ?? defaultPeriod,
    }),
  });
  const resetKey = JSON.stringify(filters(search));
  const period = usePeriodDraft({ committed: search, resetKey });
  const keyword = useKeywordDraft({
    committedItems: search.keywords ?? [],
    initialField: "email" as const,
    resetKey,
  });
  return {
    draft,
    patchDraft,
    period,
    keyword,
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSearchChange(
        compactSearchValues({
          ...search,
          ...draft,
          ...period.utcRange,
          keywords: [...keyword.itemsIncludingPending()],
          page: undefined,
        }),
      );
    },
    reset: () => {
      resetDraft();
      period.reset();
      keyword.reset();
      onSearchChange({});
    },
  };
}
