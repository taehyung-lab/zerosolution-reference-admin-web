import { toTotalPages } from "@/shared/lib/search";
import type { ListResultData } from "@/shared/ui/patterns/ListResult";
import type { MemberListRow } from "./member-row";
import { resolveMemberSearch, type MemberRouteSearch } from "./search-schema";
import { env } from "@/env";
import { selectMemberFixtures } from "../fixtures/members";

export type MemberListData = ListResultData<MemberListRow> & {
  readonly total: number;
  readonly totalPages: number;
};

// TRANSPLANT_PENDING_MEMBER_LIST_QUERY: opt-in examples exercise pre-request UI, not a backend response.
export function useMemberListData(
  routeSearch: MemberRouteSearch,
  variant: "all" | "general" | "flagged",
): MemberListData {
  const search = resolveMemberSearch(routeSearch);
  const { rows, total } = env.VITE_REFERENCE_SCENARIOS
    ? selectMemberFixtures(search, variant)
    : { rows: [], total: 0 };

  return {
    rows,
    total,
    totalPages: toTotalPages(total, search.pageSize),
    searched: routeSearch.periodType !== undefined,
    isPending: false,
    isFetching: false,
    isError: false,
    retry: () => Promise.resolve(undefined),
  };
}
