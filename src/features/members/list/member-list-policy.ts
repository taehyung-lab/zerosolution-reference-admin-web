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
