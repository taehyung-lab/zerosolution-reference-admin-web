import { memberKeywordTypes } from "../../../model/member-search";
/**
 * 회원 기록 목록의 입력 중 필터와 확정 검색 조건을 분리하고 검색·초기화를 URL 변경 callback에 전달한다.
 * 실제 API에서도 필요한 UI 상태다. 서버 행 필터링은 하지 않으며 기간·검색어 초안은 기존 공용 훅이 소유한다.
 */
import { compactSearchValues } from "@/shared/lib/compact-search-values";
import {
  filterPartitionKey,
  filterPartitionValues,
  type FilterFieldKeys,
} from "@/shared/lib/search-partition";
import { useDraftCommit } from "@/shared/lib/use-draft-commit";
import { useKeywordDraft } from "@/shared/lib/use-keyword-draft";
import { usePeriodDraft } from "@/shared/lib/use-period-draft";
import type { SubmitEvent } from "react";
import type { MemberRecordSearch } from "../../../model/member-record-search";

import {
  type memberRecordSearchContract,
  type ResolvedMemberRecordSearch,
  type MemberRecordRouteSearch,
  type MemberRecordSearchContract,
} from "./member-record-search";
type RecordFilter = Pick<
  MemberRecordSearch,
  FilterFieldKeys<typeof memberRecordSearchContract.partition>
> & { readonly periodType: string };

export function useMemberRecordFilter(
  search: ResolvedMemberRecordSearch,
  onSearchChange: (search: MemberRecordRouteSearch) => void,
  contract: MemberRecordSearchContract,
  searched: boolean,
) {
  const filterKey = (value: MemberRecordSearch) =>
    `${searched}:${filterPartitionKey(contract.schema.parse(value), contract.partition)}`;
  const { draft, patchDraft, resetDraft } = useDraftCommit({
    committed: search,
    keyOf: filterKey,
    createDraft: (value): RecordFilter =>
      filterPartitionValues(value, contract.partition),
  });
  const resetKey = filterKey(search);
  const period = usePeriodDraft({ committed: search, resetKey });
  const keyword = useKeywordDraft({
    committedItems: search.keywords,
    initialField: memberKeywordTypes[0],
    resetKey,
  });
  return {
    draft,
    patchDraft,
    period,
    keyword,
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      period.reset();
      onSearchChange(
        compactSearchValues({
          ...search,
          ...draft,
          ...period.utcRange,
          keywords: [...keyword.itemsIncludingPending()],
          page: undefined,
          searched: true,
        }),
      );
    },
    reset: () => {
      resetDraft();
      period.reset();
      keyword.reset();
      onSearchChange({});
    },
  };
}
