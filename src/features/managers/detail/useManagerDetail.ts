/**
 * 운영자 ID와 locale로 상세 query options를 만들고 공용 상세 조회 상태를 반환한다.
 * 실제 API에서도 필요한 얇은 feature 연결부이며 존재하지 않는 대상과 정상 빈 필드를 구분한다.
 */
import { useDetailQuery } from '@/api/required-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { managerDetailQuery } from '../api/queries';

export function useManagerDetail(managerId: string) {
  const { locale } = useLocale();
  return useDetailQuery(managerDetailQuery(locale, managerId));
}
