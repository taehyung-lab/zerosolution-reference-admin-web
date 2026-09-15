import type { SubmitEvent } from 'react';
import { useListFilterDraft } from '@/shared/model/use-list-filter-draft';
import { boardKeywordFields } from '@/features/community/model/board';
import { toSubmittedSearch } from './board-list-policy';
import { boardListSearchContract } from './board-list-search';
import type { BoardListSearch, ResolvedBoardListSearch } from './board-list-search';

/**
 * 검색 영역의 입력 수명과 커밋 목적지를 소유한다. 렌더는 `BoardListFilters` 가 맡는다.
 * 이 화면에는 검색 표식이 없으므로 draft 정체성의 scope 도 없다(진입 즉시 조회, 원장 7행).
 */
export function useBoardListFilter(
  search: ResolvedBoardListSearch,
  onSearchChange: (next: BoardListSearch) => void,
) {
  const inputs = useListFilterDraft({
    search,
    partition: boardListSearchContract.partition,
    keywords: search.keywords,
    initialKeywordField: boardKeywordFields[0],
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
     * 확정된 것은 "검색 조건을 default 로" 뿐이다(Notion 원문 34행).
     * 이 화면의 "검색 전 상태"가 무엇인지는 미확인이므로 결과를 비우는 idle 표식은 만들지 않는다.
     */
    reset: () => {
      inputs.resetDrafts();
      onSearchChange({});
    },
  };
}
