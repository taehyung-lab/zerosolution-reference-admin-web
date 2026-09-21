import type { SubmitEvent } from 'react';
import { memberKeywordFields } from '@/features/members/model/member';
import { useListFilterDraft } from '@/shared/hooks/use-list-filter-draft';
import { appealListSearch, type AppealListView } from './appeal-list-search';

/** 검색 영역의 입력 초안과 두 커밋. 진입 즉시 조회하는 목록이라 초기화는 기본값 URL 로 돌아간다. */
export function useAppealListFilter(search: AppealListView, commit: (next: AppealListView) => void) {
  const inputs = useListFilterDraft({
    search,
    partition: appealListSearch.partition,
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
      commit({ ...search, ...input.filters, ...input.range, keywords: [...input.keywords], page: 1 });
    },
    reset: () => {
      inputs.resetDrafts();
      commit(appealListSearch.defaults);
    },
  };
}
