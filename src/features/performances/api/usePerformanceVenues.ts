import type { PerformanceVenue } from "../model/performance";
/**
 * 공연장 필터의 선택지를 조회한다. 선택지가 아직 없는 것과 실제로 없는 것을 구분해야 하므로 상태를 함께 돌려준다.
 * 이미 받은 선택지가 있으면 갱신 실패로 선택 컨트롤을 빼앗지 않는다. 로딩·실패는 아직 보여줄 값이 없을 때만이다.
 */
import { useLocale } from "@/shared/i18n/locale-context";
import { useQuery } from "@tanstack/react-query";
import { performanceVenuesQuery } from "./queries";

/** 공연장 선택지는 별도 조회에서 오므로 그 조회 상태가 선택 컨트롤 자리까지 도달해야 한다. */
export interface PerformanceVenueOptions {
  readonly items: readonly PerformanceVenue[];
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly onRetry: () => void;
}

export function usePerformanceVenues(): PerformanceVenueOptions {
  const { locale } = useLocale();
  const query = useQuery(performanceVenuesQuery(locale));
  const loaded = query.data;
  return {
    items: loaded ?? [],
    isPending: loaded === undefined && query.isPending,
    isError: loaded === undefined && query.isError,
    onRetry: () => {
      void query.refetch();
    },
  };
}
