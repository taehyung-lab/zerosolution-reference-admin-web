import { toTotalPages } from '@/shared/lib/search';
import type { ListResultData } from '@/shared/ui/patterns/ListResult';
import type { MemberListRow } from './member-row';
import { resolveMemberSearch, type MemberRouteSearch } from './search-schema';

export type MemberListData = ListResultData<MemberListRow> & {
  readonly total: number;
  readonly totalPages: number;
};

/**
 * Owns the member contract the way `useManagerListData` owns the manager one, so the route
 * stops inventing result facts and every list state stays reachable from one place.
 *
 * TRANSPLANT_PENDING_MEMBER_LIST_QUERY: no member contract exists yet, so the committed
 * search settles into an empty result instead of running a request. Once the contract lands
 * this body becomes `useListQuery({ options, searched, select })` like `useManagerListData`;
 * nothing else on the screen changes.
 */
export function useMemberListData(routeSearch: MemberRouteSearch): MemberListData {
  const search = resolveMemberSearch(routeSearch);
  const total = 0;

  return {
    rows: [],
    total,
    totalPages: toTotalPages(total, search.pageSize),
    searched: routeSearch.periodType !== undefined,
    isPending: false,
    isFetching: false,
    isError: false,
    retry: () => Promise.resolve(undefined),
  };
}
