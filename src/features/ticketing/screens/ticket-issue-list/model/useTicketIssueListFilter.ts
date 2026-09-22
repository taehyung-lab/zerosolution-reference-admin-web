import type { SubmitEvent } from 'react';
import { ticketIssueKeywordFields } from '@/features/ticketing/model/ticket-issue';
import { useListFilterDraft } from '@/shared/hooks/use-list-filter-draft';
import { ticketIssueListSearch, type TicketIssueListView } from './ticket-issue-list-search';

/**
 * 검색 영역의 입력 초안과 두 커밋(검색·초기화). 렌더와 라벨은 `TicketIssueListFilters` 가 맡는다.
 * 검색은 필터·기간·검색어를 첫 페이지로 커밋하며 조회를 연다(`searched`). 보기·정렬은 유지한다.
 * 초기화는 기본값 복원이자 검색 전 URL 로의 복귀다(원문 「검색 조건을 default로 설정값을 변경 및
 * 검색 전 상태로 변경」). 초안의 정체성은 검색 여부까지 포함한다.
 *
 * 공연 검색어(`performanceKeyword`)는 URL 로 나가지 않는 화면 안의 초안이다. 공연을 지우면 그 공연에
 * 종속된 회차 선택도 함께 지운다 — 다른 공연의 회차 ID 가 조건으로 남지 않게 하는 것은 초안의 책임이다.
 */
export function useTicketIssueListFilter(
  search: TicketIssueListView,
  commit: (next: TicketIssueListView) => void,
) {
  const inputs = useListFilterDraft({
    search,
    partition: ticketIssueListSearch.partition,
    scope: search.searched,
    keywords: search.keywords,
    initialKeywordField: ticketIssueKeywordFields[0],
    localDefaults: { performanceKeyword: '' },
  });

  return {
    draft: inputs.draft,
    patchDraft: inputs.patchDraft,
    period: inputs.period,
    keyword: inputs.keyword,
    selectPerformance: (performanceId: string | undefined) => {
      inputs.patchDraft({ performanceId, scheduleId: undefined });
    },
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const input = inputs.prepareSubmit();
      commit({ ...search, ...input.filters, ...input.range, keywords: [...input.keywords], page: 1, searched: true });
    },
    reset: () => {
      inputs.resetDrafts();
      commit({ ...ticketIssueListSearch.defaults, searched: false });
    },
  };
}
