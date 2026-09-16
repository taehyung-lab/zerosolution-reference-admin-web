import type { SubmitEvent } from 'react';
import { memberKeywordFields } from '@/features/members/model/member';
import { useListFilterDraft } from '@/shared/model/use-list-filter-draft';
import { accessListSearch, type AccessListView } from './access-list-search';

/** 검색 영역의 입력 초안과 두 커밋(검색·초기화). */
export function useAccessListFilter(search: AccessListView, commit: (next: AccessListView) => void) {
  const inputs = useListFilterDraft({
    search,
    partition: accessListSearch.partition,
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
      commit({ ...accessListSearch.defaults, searched: false });
    },
  };
}
