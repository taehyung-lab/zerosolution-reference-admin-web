/**
 * 공연장 필터의 선택지 조회를 선택 필드 하나의 표시 상태로 바꾼다. 실패를 빈 목록으로 접지 않고
 * 로딩·실패·재시도를 필드까지 전달한다. 이미 받은 선택지가 있으면 갱신 실패로 컨트롤을 빼앗지 않는다.
 */
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/shared/i18n/locale-context';
import type { AsyncFieldState } from '@/shared/ui/feedback/AsyncFieldBoundary';
import type { PerformanceVenue } from '../model/performance';
import { performanceVenuesQuery } from './queries';

export interface PerformanceVenueOptions {
  readonly state: AsyncFieldState;
  readonly items: readonly PerformanceVenue[];
  readonly retry: () => void;
}

export function usePerformanceVenues(): PerformanceVenueOptions {
  const { locale } = useLocale();
  const query = useQuery(performanceVenuesQuery(locale));
  return {
    state: query.data !== undefined ? 'ready' : query.isError ? 'error' : 'loading',
    items: query.data ?? [],
    retry: () => void query.refetch(),
  };
}
