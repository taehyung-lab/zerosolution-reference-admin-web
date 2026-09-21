import type { SubmitEvent } from 'react';
import { useListFilterDraft } from '@/shared/hooks/use-list-filter-draft';
import { withdrawnListSearch, type WithdrawnListView } from './withdrawn-list-search';

/** 검색 영역의 입력 초안과 두 커밋(검색·초기화). 검색어 대상은 이메일 하나다. */
export function useWithdrawnListFilter(search: WithdrawnListView, commit: (next: WithdrawnListView) => void) {
  const inputs = useListFilterDraft({
    search,
    partition: withdrawnListSearch.partition,
    scope: search.searched,
    keywords: search.keywords,
    initialKeywordField: 'email' as const,
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
      commit({ ...withdrawnListSearch.defaults, searched: false });
    },
  };
}
