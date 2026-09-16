import type { SubmitEvent } from 'react';
import { useListFilterDraft } from '@/shared/model/use-list-filter-draft';
import { printerKeywordFields } from '@/features/ticketing/model/printer';
import { printerListSearch, type PrinterListView } from './printer-list-search';

/**
 * 검색 영역의 입력 초안과 두 커밋(검색·초기화)을 소유한다. 렌더와 라벨은 `PrinterListFilters` 가 맡는다.
 * 검색은 필터·기간·검색어를 첫 페이지로 커밋하고 보기·정렬은 유지한다.
 * 초기화는 원문 `검색 조건을 default 로` 대로 선언된 기본값을 커밋한다(진입과 같은 URL).
 */
export function usePrinterListFilter(
  search: PrinterListView,
  commit: (next: PrinterListView) => void,
) {
  const inputs = useListFilterDraft({
    search,
    partition: printerListSearch.partition,
    keywords: search.keywords,
    initialKeywordField: printerKeywordFields[0],
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
      commit(printerListSearch.defaults);
    },
  };
}
