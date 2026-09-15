import { useListFilterDraft } from "@/shared/model/use-list-filter-draft";
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
) {
  const inputs = useListFilterDraft({
    search,
    partition: performanceSearchPartition,
    keywords: search.keywords,
    initialKeywordField: performanceKeywordFields[0],
    localDefaults: { venueKeyword: "" },
  });
  const { draft, patchDraft, period, keyword } = inputs;

  return {
    draft,
    patchDraft,
    period,
    keyword,
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const input = inputs.prepareSubmit();
      onChange(
        performanceSearchSchema.parse({
          ...search,
          ...input.filters,
          ...input.range,
          keywords: input.keywords,
          page: undefined,
        }),
      );
    },
    reset: () => {
      inputs.resetDrafts();
      onChange({});
    },
  };
}
