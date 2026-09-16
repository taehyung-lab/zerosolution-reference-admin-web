import type { SubmitEvent } from 'react';
import { useListFilterDraft } from '@/shared/model/use-list-filter-draft';
import { printerKeywordFields } from '@/features/ticketing/model/printer';
import { toSubmittedSearch } from './printer-list-policy';
import { printerListSearchContract } from './printer-list-search';
import type { PrinterListSearch, ResolvedPrinterListSearch } from './printer-list-search';

/**
 * 검색 영역의 입력 수명과 커밋 목적지를 소유한다. 렌더는 `PrinterListFilters` 가 맡는다.
 * 이 화면에는 검색 표식이 없으므로 draft 정체성의 scope 도 없다(진입 즉시 조회).
 */
export function usePrinterListFilter(
  search: ResolvedPrinterListSearch,
  onSearchChange: (next: PrinterListSearch) => void,
) {
  const inputs = useListFilterDraft({
    search,
    partition: printerListSearchContract.partition,
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
      onSearchChange(toSubmittedSearch(search, inputs.prepareSubmit()));
    },
    /**
     * 원문은 `초기화 → 검색 조건을 default 로 설정값을 변경 및 검색 전 상태로 변경` 이다.
     * 초기화는 최초 진입 계약을 다시 적용하므로(2026-09-15 사용자 확정) 이 화면에서는
     * 조건만 default 로 돌아가고 조회 상태는 진입과 같이 유지된다.
     */
    reset: () => {
      inputs.resetDrafts();
      onSearchChange({});
    },
  };
}
