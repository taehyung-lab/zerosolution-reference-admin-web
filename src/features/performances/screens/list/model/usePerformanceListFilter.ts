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
  resolvePerformanceSearch,
  type PerformanceRouteSearch,
} from "./search-schema";

const filterKey = (value: PerformanceRouteSearch) =>
  filterPartitionKey(value, performanceSearchPartition);

export function usePerformanceListFilter(
  search: PerformanceRouteSearch,
  onChange: (next: PerformanceRouteSearch) => void,
) {
  const draft = useDraftCommit({
    committed: search,
    keyOf: filterKey,
    createDraft: (value) => ({
      ...filterPartitionValues(
        resolvePerformanceSearch(value),
        performanceSearchPartition,
      ),
      venueKeyword: "",
    }),
  });
  const resetKey = filterKey(search);
  const period = usePeriodDraft({ committed: search, resetKey });
  const keyword = useKeywordDraft({
    committedItems: search.keywords ?? [],
    initialField: "title" as const,
    resetKey,
  });

  return {
    ...draft,
    period,
    keyword,
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
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
