import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useListQuery } from '@/api/list-query';
import { ticketIssueListQueryOptions } from '@/features/ticketing/api/queries';
import type { TicketIssueCounts } from '@/features/ticketing/model/ticket-issue';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toTicketIssueListRequest, type TicketIssueListView } from './ticket-issue-list-search';

/**
 * 전체발권 목록의 조회 사실. 검색 전(`searched` 없음)에는 조회하지 않고 안내 문구 상태다.
 *
 * 결과 영역의 상태 카운트는 같은 페이지 응답이 들고 오므로 같은 query 선언을 다른 projection 으로
 * 한 번 더 읽는다 — 키가 같아 요청은 하나이고, 카운트가 바뀔 때만 이 구독이 다시 그린다.
 * 진입 overlay 는 목록 쪽 관측자(`useListQuery`)가 소유하므로 여기에 progress meta 를 더하지 않는다.
 */
export function useTicketIssueListData(search: TicketIssueListView) {
  const { locale } = useLocale();
  const options = ticketIssueListQueryOptions(locale, toTicketIssueListRequest(search));
  const query = useListQuery({
    options,
    searched: search.searched,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });
  const counts = useQuery({
    ...options,
    enabled: search.searched,
    placeholderData: keepPreviousData,
    select: (page): TicketIssueCounts => page.counts,
  });

  return {
    ...query,
    counts: counts.data,
    totalPages: toTotalPages(query.total, search.pageSize),
  };
}
