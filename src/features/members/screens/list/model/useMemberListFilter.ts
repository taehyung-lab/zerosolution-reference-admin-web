/**
 * 확정 URL과 입력 중 필터를 연결하고 기간·검색어 초안을 검색/초기화 시 반영한다.
 * 실제 API에서도 유지할 UI workflow다. 공용 draft 훅을 사용하되 회원별 기본값과 URL 전이는 feature가 소유한다.
 */
import {
  filterPartitionKey,
  filterPartitionValues,
  type FilterFieldKeys,
} from "@/shared/lib/search-partition";
import { useDraftCommit } from "@/shared/lib/use-draft-commit";
import { useKeywordDraft } from "@/shared/lib/use-keyword-draft";
import { usePeriodDraft } from "@/shared/lib/use-period-draft";
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

type MemberFilter = Pick<
  MemberSearch,
  FilterFieldKeys<typeof memberSearchPartition>
>;

export function useMemberListFilter({
  search,
  searched,
  onSearchChange,
}: {
  readonly search: MemberSearch;
  readonly searched: boolean;
  readonly onSearchChange: (next: MemberRouteSearch) => void;
}) {
  const partition = memberSearchPartition;
  const filterKey = (value: MemberSearch) =>
    filterPartitionKey(value, partition);
  const resetKey = JSON.stringify([searched, filterKey(search)]);
  const { draft, patchDraft, resetDraft } = useDraftCommit({
    committed: { search, searched },
    keyOf: (value) => JSON.stringify([value.searched, filterKey(value.search)]),
    // 초안에는 필터만 보관한다. 확정된 정렬·페이지 상태를 다음 필터 입력이 덮어쓰지 않게 한다.
    createDraft: ({ search: value }): MemberFilter =>
      filterPartitionValues(value, partition),
  });
  const period = usePeriodDraft({
    committed: search,
    resetKey,
  });
  const keyword = useKeywordDraft({
    committedItems: search.keywords,
    initialField: memberKeywordTypes[0],
    resetKey,
  });

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    period.reset();
    const next: MemberSearch = {
      ...search,
      ...draft,
      ...period.utcRange,
      keywords: keyword.itemsIncludingPending(),
      page: 1,
    };
    onSearchChange(toMemberRouteSearch(next));
  };

  const reset = () => {
    resetDraft();
    period.reset();
    keyword.reset();
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
