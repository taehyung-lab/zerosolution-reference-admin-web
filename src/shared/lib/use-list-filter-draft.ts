import {
  filterPartitionKey,
  filterPartitionValues,
  type SearchFieldPartition,
} from "./search-partition";
import { useDraftCommit } from "./use-draft-commit";
import { useKeywordDraft, type KeywordFilterItem } from "./use-keyword-draft";
import { usePeriodDraft, type UtcPeriodRange } from "./use-period-draft";

/** Coordinates input drafts only; the caller still validates and commits its own search. */
export function useListFilterDraft<
  TSearch extends UtcPeriodRange,
  const TPartition extends Partial<SearchFieldPartition<TSearch>>,
  TField extends string | undefined,
  TLocal extends object = Record<never, never>,
>({
  search,
  partition,
  scope,
  keywords,
  initialKeywordField,
  localDefaults,
}: {
  readonly search: TSearch;
  readonly partition: TPartition;
  readonly scope?: string | number | boolean;
  readonly keywords: readonly KeywordFilterItem<TField>[];
  readonly initialKeywordField: TField;
  readonly localDefaults?: TLocal & { readonly [K in keyof TSearch]?: never };
}) {
  const resetKey = JSON.stringify([
    scope,
    filterPartitionKey(search, partition),
  ]);
  const draft = useDraftCommit({
    committed: search,
    keyOf: () => resetKey,
    createDraft: (value) => ({
      ...filterPartitionValues(value, partition),
      ...(localDefaults ?? ({} as TLocal)),
    }),
  });
  const period = usePeriodDraft({ committed: search, resetKey });
  const keyword = useKeywordDraft({
    committedItems: keywords,
    initialField: initialKeywordField,
    resetKey,
  });

  return {
    draft: draft.draft,
    patchDraft: draft.patchDraft,
    period,
    keyword,
    prepareSubmit: () => {
      const input = {
        filters: filterPartitionValues<TSearch, TPartition>(
          { ...search, ...draft.draft },
          partition,
        ),
        range: period.utcRange,
        keywords: keyword.itemsIncludingPending(),
      };
      // A partial date that normalizes to the same URL must not remain stranded in the input.
      period.reset();
      return input;
    },
    resetDrafts: () => {
      draft.resetDraft();
      period.reset();
      keyword.reset();
    },
  };
}
