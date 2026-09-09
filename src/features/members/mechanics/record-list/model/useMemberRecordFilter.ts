import { memberKeywordTypes } from "../../../model/member-search";
/**
 * 회원 기록 목록의 입력 중 필터와 확정 검색 조건을 분리하고 검색·초기화를 URL 변경 callback에 전달한다.
 * 실제 API에서도 필요한 UI 상태다. 서버 행 필터링은 하지 않으며 기간·검색어 초안은 기존 공용 훅이 소유한다.
 */
import { compactSearchValues } from "@/shared/lib/compact-search-values";
import { useListFilterDraft } from "@/shared/lib/use-list-filter-draft";
import type { SubmitEvent } from "react";
import type { MemberRecordSearch } from "../../../model/member-record-search";

import {
  type ResolvedMemberRecordSearch,
  type MemberRecordRouteSearch,
  type MemberRecordSearchContract,
} from "./member-record-search";

export function useMemberRecordFilter(
  search: ResolvedMemberRecordSearch,
  onSearchChange: (search: MemberRecordRouteSearch) => void,
  contract: MemberRecordSearchContract,
  searched: boolean,
) {
  const inputs = useListFilterDraft<
    MemberRecordSearch & { readonly periodType: string },
    MemberRecordSearchContract["partition"],
    NonNullable<MemberRecordSearch["keywords"]>[number]["field"]
  >({
    search,
    partition: contract.partition,
    scope: searched,
    keywords: search.keywords,
    initialKeywordField: memberKeywordTypes[0],
  });
  const { draft, patchDraft, period, keyword } = inputs;
  return {
    draft,
    patchDraft,
    period,
    keyword,
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const input = inputs.prepareSubmit();
      onSearchChange(
        compactSearchValues({
          ...search,
          ...input.filters,
          ...input.range,
          keywords: [...input.keywords],
          page: undefined,
          searched: true,
        }),
      );
    },
    reset: () => {
      inputs.resetDrafts();
      onSearchChange({});
    },
  };
}
