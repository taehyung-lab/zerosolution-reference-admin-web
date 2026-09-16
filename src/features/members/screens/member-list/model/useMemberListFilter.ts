import type { SubmitEvent } from 'react';
import { memberKeywordFields } from '@/features/members/model/member';
import { useListFilterDraft } from '@/shared/model/use-list-filter-draft';
import { memberListSearch, type MemberListView } from './member-list-search';

/**
 * 검색 영역의 입력 초안과 두 커밋(검색·초기화). 렌더와 라벨은 `MemberListFilters` 가 맡는다.
 * 검색은 필터·기간·검색어를 첫 페이지로 커밋하며 조회를 연다(`searched`). 보기·정렬은 유지한다.
 * 초기화는 기본값 복원이 아니라 검색 전 URL 로의 복귀다. 초안의 정체성은 검색 여부까지 포함한다.
 */
export function useMemberListFilter(search: MemberListView, commit: (next: MemberListView) => void) {
  const inputs = useListFilterDraft({
    search,
    partition: memberListSearch.partition,
    scope: search.searched,
    keywords: search.keywords,
    initialKeywordField: memberKeywordFields[0],
  });

  return {
    draft: inputs.draft,
    patchDraft: inputs.patchDraft,
    period: inputs.period,
    keyword: inputs.keyword,
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const input = inputs.prepareSubmit();
      commit({ ...search, ...input.filters, ...input.range, keywords: [...input.keywords], page: 1, searched: true });
    },
    reset: () => {
      inputs.resetDrafts();
      commit({ ...memberListSearch.defaults, searched: false });
    },
  };
}
