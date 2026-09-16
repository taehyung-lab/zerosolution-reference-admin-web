import type { SubmitEvent } from 'react';
import { useListFilterDraft } from '@/shared/model/use-list-filter-draft';
import { managerKeywordFields } from '@/features/managers/model/manager';
import { managerListSearch, type ManagerListView } from './manager-list-search';

/**
 * 검색 영역의 입력 초안과 두 커밋(검색·초기화)을 소유한다. 렌더와 라벨은 `ManagerListFilters` 가 맡는다.
 * 검색은 필터·기간·검색어를 첫 페이지로 커밋하며 조회를 연다(`searched`). 보기·정렬은 유지한다.
 * 초기화는 기본값 복원이 아니라 검색 전 URL 로의 복귀다(원장 11.1 진입 상태).
 * 초안의 정체성은 검색 여부까지 포함해, 검색 전과 뒤의 초안이 섞이지 않는다.
 */
export function useManagerListFilter(
  search: ManagerListView,
  commit: (next: ManagerListView) => void,
) {
  const inputs = useListFilterDraft({
    search,
    partition: managerListSearch.partition,
    scope: search.searched,
    keywords: search.keywords,
    initialKeywordField: managerKeywordFields[0],
  });

  return {
    draft: inputs.draft,
    patchDraft: inputs.patchDraft,
    period: inputs.period,
    keyword: inputs.keyword,
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const input = inputs.prepareSubmit();
      commit({
        ...search,
        ...input.filters,
        ...input.range,
        keywords: [...input.keywords],
        page: 1,
        searched: true,
      });
    },
    reset: () => {
      inputs.resetDrafts();
      commit({ ...managerListSearch.defaults, searched: false });
    },
  };
}
