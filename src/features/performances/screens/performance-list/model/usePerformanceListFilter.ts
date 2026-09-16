import type { SubmitEvent } from 'react';
import { useListFilterDraft } from '@/shared/model/use-list-filter-draft';
import { performanceKeywordFields } from '@/features/performances/model/performance';
import { performanceListSearch, type PerformanceListView } from './performance-list-search';

/**
 * 검색 영역의 입력 초안과 두 커밋(검색·초기화)을 소유한다. 렌더와 라벨은 `PerformanceListFilters` 가 맡는다.
 * 공연장 검색어(`venueKeyword`)는 URL 로 나가지 않는 화면 안의 초안이다.
 * 초기화는 선언된 기본값을 커밋한다(진입과 같은 URL, 결과는 남는다 — 진입 즉시 조회 계약).
 */
export function usePerformanceListFilter(
  search: PerformanceListView,
  commit: (next: PerformanceListView) => void,
) {
  const inputs = useListFilterDraft({
    search,
    partition: performanceListSearch.partition,
    keywords: search.keywords,
    initialKeywordField: performanceKeywordFields[0],
    localDefaults: { venueKeyword: '' },
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
      commit(performanceListSearch.defaults);
    },
  };
}
