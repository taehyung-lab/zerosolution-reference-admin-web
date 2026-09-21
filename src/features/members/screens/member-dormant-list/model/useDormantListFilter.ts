import type { SubmitEvent } from 'react';
import { memberKeywordFields } from '@/features/members/model/member';
import { useListFilterDraft } from '@/shared/hooks/use-list-filter-draft';
import { dormantListSearch, type DormantListView } from './dormant-list-search';

/** 검색 영역의 입력 초안과 두 커밋(검색·초기화). 검색은 첫 페이지로 조회를 열고 초기화는 검색 전 URL 로 돌아간다. */
export function useDormantListFilter(search: DormantListView, commit: (next: DormantListView) => void) {
  const inputs = useListFilterDraft({
    search,
    partition: dormantListSearch.partition,
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
      commit({ ...dormantListSearch.defaults, searched: false });
    },
  };
}
