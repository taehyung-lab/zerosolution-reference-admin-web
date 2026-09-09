import { localizedQueryKey } from "@/api/query-key";
import { blockingProgress, inlineProgress } from "@/api/query-meta";
import { readPerformanceDetail } from "../fixtures/performance-details";
import type { UiLocale } from "@/shared/i18n/locale";
import { queryOptions } from "@tanstack/react-query";
import {
  readPerformancePage,
  readPerformanceVenues,
} from "../fixtures/performances";
import type { PerformanceSearch } from "../model/performance-search";

export function performanceDetailQuery(locale: UiLocale, id: string) {
  return queryOptions({
    queryKey: localizedQueryKey(locale, "performances", "detail", id),
    queryFn: () => readPerformanceDetail(id),
    ...blockingProgress,
  });
}

export function performanceListQuery(
  locale: UiLocale,
  search: PerformanceSearch,
) {
  return queryOptions({
    queryKey: [
      ...localizedQueryKey(locale, "performances", "list"),
      search,
    ] as const,
    queryFn: () => readPerformancePage(search),
  });
}

/**
 * 공연장 필터의 선택지다. 목록 요청과 별개로 필터 안에서만 필요하므로 진입 overlay를 열지 않는다.
 * TRANSPLANT_PENDING_PERFORMANCE_VENUE_CONTRACT: 실제 공연장 조회 endpoint와 검색 파라미터가 미확인이라
 * 현재는 전체 예시 목록을 돌려주고 검색어 대조는 필터가 클라이언트에서 수행한다.
 */
export function performanceVenuesQuery(locale: UiLocale) {
  return queryOptions({
    queryKey: localizedQueryKey(locale, "performances", "venues"),
    queryFn: () => readPerformanceVenues(),
    staleTime: Infinity,
    ...inlineProgress,
  });
}
