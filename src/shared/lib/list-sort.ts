/**
 * Header sort state for one sortable column. The list owns which key is active and in which URL
 * direction (`asc` | `desc`); the table header speaks the `aria-sort` vocabulary. Exactly the active
 * key gets a direction and every other sortable header gets `undefined` (one `aria-sort` per table).
 *
 * `direction` is required on purpose: a list whose URL contract leaves `sortDirection` undefined by
 * default rendered its active column with no arrow at all (observed on two independent lists),
 * so the resolved search must supply the default before it reaches the columns.
 */
export type ListSortDirection = 'asc' | 'desc';
export type HeaderSortDirection = 'ascending' | 'descending';

export interface ActiveListSort<Key extends string> {
  readonly type: Key;
  readonly direction: ListSortDirection;
}

export function headerSortDirection<Key extends string>(
  active: ActiveListSort<Key>,
  key: Key,
): HeaderSortDirection | undefined {
  if (active.type !== key) return undefined;
  return active.direction === 'asc' ? 'ascending' : 'descending';
}
