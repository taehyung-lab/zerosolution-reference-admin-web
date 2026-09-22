import type { SubmitEvent } from 'react';
import { useListFilterDraft } from '@/shared/hooks/use-list-filter-draft';
import { termsKeywordFields } from '@/features/terms/model/terms';
import { termsListSearch, type TermsListView } from './terms-list-search';

/**
 * 검색 영역의 입력 초안과 두 커밋(검색·초기화)을 소유한다. 렌더와 라벨은 `TermsListFilters` 가 맡는다.
 * 검색은 필터·기간·검색어를 첫 페이지로 커밋하고 보기·정렬은 유지한다(Notion `검색 조건에 부합하는
 * 검색결과 호출`). 초기화는 `검색 조건을 default 로` 대로 선언된 기본값을 커밋한다 — 이 화면은 진입 즉시
 * 조회라 초기화 뒤 URL 이 진입과 같아진다.
 */
export function useTermsListFilter(search: TermsListView, commit: (next: TermsListView) => void) {
  const inputs = useListFilterDraft({
    search,
    partition: termsListSearch.partition,
    keywords: search.keywords,
    initialKeywordField: termsKeywordFields[0],
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
      commit(termsListSearch.defaults);
    },
  };
}
