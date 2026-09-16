/**
 * 운영자 ID 와 locale 로 상세 query options 를 만들고 공용 상세 조회 상태를 반환한다.
 * 조회 화면과 수정 화면이 같은 훅을 쓰며, 어떤 ID 를 볼지는 caller(route)가 소유한다.
 */
import { useDetailQuery } from '@/api/required-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { managerDetailQueryOptions } from './queries';

export function useManagerDetail(managerId: string) {
  const { locale } = useLocale();
  return useDetailQuery(managerDetailQueryOptions(locale, managerId));
}
