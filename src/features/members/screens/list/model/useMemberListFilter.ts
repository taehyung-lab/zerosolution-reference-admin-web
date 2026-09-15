/**
 * 확정 URL과 입력 중 필터를 연결하고 기간·검색어 초안을 검색/초기화 시 반영한다.
 * 실제 API에서도 유지할 UI workflow다. 공용 draft 훅을 사용하되 회원별 기본값과 URL 전이는 feature가 소유한다.
 */
import { useListFilterDraft } from "@/shared/model/use-list-filter-draft";
import { type SubmitEvent } from "react";
import {
  memberKeywordTypes,
  type MemberSearch,
} from "../../../model/member-search";
import {
  memberSearchPartition,
  toMemberRouteSearch,
  type MemberRouteSearch,
} from "./search-schema";

export function useMemberListFilter({
  search,
  searched,
  onSearchChange,
}: {
  readonly search: MemberSearch;
  readonly searched: boolean;
  readonly onSearchChange: (next: MemberRouteSearch) => void;
}) {
  const inputs = useListFilterDraft({
    search,
    partition: memberSearchPartition,
    scope: searched,
    keywords: search.keywords,
    initialKeywordField: memberKeywordTypes[0],
  });
  const { draft, patchDraft, period, keyword } = inputs;

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = inputs.prepareSubmit();
    const next: MemberSearch = {
      ...search,
      ...input.filters,
      ...input.range,
      keywords: input.keywords,
      page: 1,
    };
    onSearchChange(toMemberRouteSearch(next));
  };

  const reset = () => {
    inputs.resetDrafts();
    onSearchChange({});
  };

  return {
    draft,
    patchDraft,
    period,
    keyword,
    addKeyword: keyword.addPending,
    submit,
    reset,
  };
}
