import type { MemberSearch } from './search-schema';

export function changeMemberListView(
  search: MemberSearch,
  patch: Partial<MemberSearch>,
): MemberSearch {
  return { ...search, ...patch, page: 1 };
}

export function changeMemberListPage(search: MemberSearch, page: number): MemberSearch {
  return { ...search, page };
}

export function toggleMemberPageSelection(
  selected: ReadonlySet<string>,
  selectableIds: readonly string[],
  checked: boolean,
): ReadonlySet<string> {
  const next = new Set(selected);
  for (const id of selectableIds) {
    if (checked) next.add(id);
    else next.delete(id);
  }
  return next;
}

export function pruneSelectedMemberIds(
  selected: ReadonlySet<string>,
  selectableIds: readonly string[],
): ReadonlySet<string> {
  const allowed = new Set(selectableIds);
  return new Set([...selected].filter((id) => allowed.has(id)));
}
