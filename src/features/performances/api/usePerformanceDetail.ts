/**
 * 공연 ID 와 locale 로 상세 query options 를 만들고 공용 상세 조회 상태를 반환한다.
 * 어떤 ID 를 볼지는 caller(route)가 소유한다.
 */
import { useDetailQuery } from '@/api/required-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { performanceDetailQueryOptions } from './queries';

export function usePerformanceDetail(performanceId: string) {
  const { locale } = useLocale();
  return useDetailQuery(performanceDetailQueryOptions(locale, performanceId));
}
