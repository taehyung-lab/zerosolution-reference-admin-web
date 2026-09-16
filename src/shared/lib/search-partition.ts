/**
 * Filter fields survive a draft; view fields (page, page size, sort) are read back from the
 * committed search. Declaring the split once with `satisfies` turns a forgotten field into a
 * compile error instead of a draft that silently stops rebuilding.
 *
 * Promoted to shared after a second route-backed list reproduced the same defect: a draft built
 * from the whole resolved search let the next filter submit undo a sort or page-size commit.
 * The mechanic reads a caller-declared partition and knows no domain.
 */
export type SearchFieldKind = "filter" | "view";

export type SearchFieldPartition<TSearch> = Readonly<
  Record<keyof TSearch, SearchFieldKind>
>;

/** The filter half of a declared partition, so a draft patch cannot address view state. */
export type FilterFieldKeys<TPartition> = TPartition extends unknown
  ? {
      [K in keyof TPartition]-?: TPartition[K] extends "filter" ? K : never;
    }[keyof TPartition]
  : never;

type CommonFilterKeys<TPartition> = {
  [K in FilterFieldKeys<TPartition>]: [TPartition] extends [Record<K, "filter">]
    ? K
    : never;
}[FilterFieldKeys<TPartition>];

type FilterValues<TSearch, TPartition> = Pick<
  TSearch,
  CommonFilterKeys<TPartition> & keyof TSearch
> &
  Partial<
    Pick<
      TSearch,
      Exclude<FilterFieldKeys<TPartition>, CommonFilterKeys<TPartition>> &
        keyof TSearch
    >
  >;

function keysOfKind<TSearch>(
  partition: Partial<SearchFieldPartition<TSearch>>,
  kind: SearchFieldKind,
): string[] {
  return Object.keys(partition)
    .filter((key) => partition[key as keyof TSearch] === kind)
    .sort();
}

/** Stable identity of the filter fields only; view changes must not rebuild a filter draft. */
export function filterPartitionKey<TSearch extends object>(
  search: TSearch,
  partition: Partial<SearchFieldPartition<TSearch>>,
): string {
  const values = search as Readonly<Record<string, unknown>>;
  return JSON.stringify(
    keysOfKind(partition, "filter").map((key) => [key, values[key] ?? null]),
  );
}

/** The filter half of a search, so a draft never holds view state it would have to discard. */
export function filterPartitionValues<
  TSearch extends object,
  const TPartition extends Partial<SearchFieldPartition<TSearch>>,
>(search: TSearch, partition: TPartition): FilterValues<TSearch, TPartition> {
  const values = search as Readonly<Record<string, unknown>>;
  return Object.fromEntries(
    keysOfKind(partition, "filter").map((key) => [key, values[key]]),
  ) as FilterValues<TSearch, TPartition>;
}
