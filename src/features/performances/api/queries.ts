import { queryOptions } from '@tanstack/react-query';
import { localizedQueryKey } from '@/api/query-key';
import { inlineProgress } from '@/api/query-meta';
import type { UiLocale } from '@/shared/i18n/locale';
import { readPerformanceDetail } from '../fixtures/performance-details';
import { readPerformancePage, readPerformanceVenues } from '../fixtures/performances';
import type { PerformanceListRequest } from '../model/performance';

/**
 * 공연 조회의 유일한 query 선언들. 화면·route loader·테스트가 같은 정의를 소비한다.
 *
 * TRANSPLANT_PENDING_PERFORMANCE_QUERY: queryFn 은 아직 임시 응답 함수다. 실제 endpoint 가 확정되면
 * 여기서 생성된 operation 을 호출하고 fixtures 를 지운다. 요청 입력과 캐시 키는 화면이 해소한 같은
 * 값이므로 그때도 바뀌지 않는다.
 */
export function performanceListQueryOptions(locale: UiLocale, request: PerformanceListRequest) {
  return queryOptions({
    queryKey: [...localizedQueryKey(locale, 'performances', 'list'), request] as const,
    queryFn: () => readPerformancePage(request),
  });
}

export function performanceDetailQueryOptions(locale: UiLocale, performanceId: string) {
  return queryOptions({
    queryKey: localizedQueryKey(locale, 'performances', 'detail', performanceId),
    queryFn: () => readPerformanceDetail(performanceId),
  });
}

/**
 * 공연장 필터의 선택지. 목록 요청과 별개로 필터 안에서만 필요하므로 진입 overlay 를 열지 않는다.
 * TRANSPLANT_PENDING_PERFORMANCE_VENUE_CONTRACT: 실제 공연장 조회 endpoint 와 검색 파라미터가 미확인이라
 * 전체 예시 목록을 돌려주고 검색어 대조는 필터가 클라이언트에서 한다.
 */
export function performanceVenuesQuery(locale: UiLocale) {
  return queryOptions({
    queryKey: localizedQueryKey(locale, 'performances', 'venues'),
    queryFn: () => readPerformanceVenues(),
    staleTime: Infinity,
    ...inlineProgress,
  });
}
