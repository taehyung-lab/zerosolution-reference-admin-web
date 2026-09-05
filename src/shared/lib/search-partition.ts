/**
 * Filter fields survive a draft; view fields (page, page size, sort) are read back from the
 * committed search. Declaring the split once with `satisfies` turns a forgotten field into a
 * compile error instead of a draft that silently stops rebuilding.
 *
 * Promoted to shared 2026-09-05: the second route-backed list showed the same defect. Members
 * built its draft from the whole resolved search, so a sort or page-size commit was undone by
 * the next filter submit. The mechanic reads a caller-declared partition and knows no domain.
 */
export type SearchFieldKind = 'filter' | 'view';

export type SearchFieldPartition<TSearch> = Readonly<
  Record<keyof TSearch, SearchFieldKind>
>;

/** The filter half of a declared partition, so a draft patch cannot address view state. */
export type FilterFieldKeys<TPartition> = {
  [K in keyof TPartition]: TPartition[K] extends 'filter' ? K : never;
}[keyof TPartition];

function keysOfKind<TSearch>(
  partition: SearchFieldPartition<TSearch>,
  kind: SearchFieldKind,
): string[] {
  return Object.keys(partition)
    .filter((key) => partition[key as keyof TSearch] === kind)
    .sort();
}

/** Stable identity of the filter fields only; view changes must not rebuild a filter draft. */
export function filterPartitionKey<TSearch extends object>(
  search: TSearch,
  partition: SearchFieldPartition<TSearch>,
): string {
  const values = search as Readonly<Record<string, unknown>>;
  return JSON.stringify(
    keysOfKind(partition, 'filter').map((key) => [key, values[key] ?? null]),
  );
}

/** The filter half of a search, so a draft never holds view state it would have to discard. */
export function filterPartitionValues<
  TSearch extends object,
  const TPartition extends SearchFieldPartition<TSearch>,
>(
  search: TSearch,
  partition: TPartition,
): Pick<TSearch, FilterFieldKeys<TPartition> & keyof TSearch> {
  const values = search as Readonly<Record<string, unknown>>;
  return Object.fromEntries(
    keysOfKind(partition, 'filter').map((key) => [key, values[key]]),
  ) as Pick<TSearch, FilterFieldKeys<TPartition> & keyof TSearch>;
}

