import {
  filterPartitionKey,
  filterPartitionValues,
} from "@/shared/lib/search-partition";
import { useDraftCommit } from "@/shared/lib/use-draft-commit";
import { useKeywordDraft } from "@/shared/lib/use-keyword-draft";
import { usePeriodDraft } from "@/shared/lib/use-period-draft";
import type { SubmitEvent } from "react";
import {
  performanceSearchPartition,
  performanceSearchSchema,
  performanceKeywordFields,
  type ResolvedPerformanceSearch,
  type PerformanceRouteSearch,
} from "./search-schema";

export function usePerformanceListFilter(
  search: ResolvedPerformanceSearch,
  onChange: (next: PerformanceRouteSearch) => void,
  searched: boolean,
) {
  const filterKey = (value: {
    search: ResolvedPerformanceSearch;
    searched: boolean;
  }) =>
    JSON.stringify([
      value.searched,
      filterPartitionKey(value.search, performanceSearchPartition),
    ]);
  const draft = useDraftCommit({
    committed: { search, searched },
    keyOf: filterKey,
    createDraft: (value) => ({
      ...filterPartitionValues(value.search, performanceSearchPartition),
      venueKeyword: "",
    }),
  });
  const resetKey = filterKey({ search, searched });
  const period = usePeriodDraft({ committed: search, resetKey });
  const keyword = useKeywordDraft({
    committedItems: search.keywords,
    initialField: performanceKeywordFields[0],
    resetKey,
  });

  return {
    ...draft,
    period,
    keyword,
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      period.reset();
      onChange(
        performanceSearchSchema.parse({
          ...search,
          ...draft.draft,
          ...period.utcRange,
          keywords: keyword.itemsIncludingPending(),
          page: undefined,
          searched: undefined,
        }),
      );
    },
    reset: () => {
      draft.resetDraft();
      period.reset();
      keyword.reset();
      onChange({ searched: false });
    },
  };
}
