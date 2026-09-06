import { dormantData } from "../records/member-record-data";
import type { MemberRecordSearch } from "../records/member-record-search";
export function useDormantMemberListData(search: MemberRecordSearch) {
  return {
    ...dormantData(search),
    searched: search.periodType !== undefined,
    isPending: false,
    isFetching: false,
    isError: false,
    retry: () => Promise.resolve(),
  };
}
