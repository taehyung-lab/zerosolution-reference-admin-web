/**
 * 전체발권 검색 영역의 두 서버 선택지를 각각 필드 하나의 표시 상태로 바꾼다. 실패를 빈 목록으로
 * 접지 않고 로딩·실패·재시도를 필드까지 전달한다. 공연일은 공연을 고른 뒤에만 열리는 종속 조회라
 * 고르기 전에는 query 를 켜지 않는다.
 */
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/shared/i18n/locale-context';
import type { AsyncFieldState } from '@/shared/ui/feedback/AsyncFieldBoundary';
import type { TicketIssuePerformance, TicketIssueSchedule } from '../model/ticket-issue';
import { ticketIssuePerformancesQuery, ticketIssueSchedulesQuery } from './queries';

export interface TicketIssuePerformanceOptions {
  readonly state: AsyncFieldState;
  readonly items: readonly TicketIssuePerformance[];
  readonly retry: () => void;
}

export function useTicketIssuePerformances(): TicketIssuePerformanceOptions {
  const { locale } = useLocale();
  const query = useQuery(ticketIssuePerformancesQuery(locale));
  return {
    state: query.data !== undefined ? 'ready' : query.isError ? 'error' : 'loading',
    items: query.data ?? [],
    retry: () => void query.refetch(),
  };
}

export interface TicketIssueScheduleOptions {
  readonly state: AsyncFieldState;
  readonly items: readonly TicketIssueSchedule[];
  readonly retry: () => void;
}

export function useTicketIssueSchedules(performanceId: string | undefined): TicketIssueScheduleOptions {
  const { locale } = useLocale();
  const query = useQuery({
    ...ticketIssueSchedulesQuery(locale, performanceId ?? ''),
    enabled: performanceId !== undefined,
  });
  return {
    state: query.data !== undefined ? 'ready' : query.isError ? 'error' : 'loading',
    items: query.data ?? [],
    retry: () => void query.refetch(),
  };
}
