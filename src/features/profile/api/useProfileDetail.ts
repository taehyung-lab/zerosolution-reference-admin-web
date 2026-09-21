/**
 * 내 계정 조회 query options 를 locale 에 묶고 공용 상세 조회 상태를 반환한다. 조회 화면과 수정
 * 화면이 같은 훅을 쓴다. 어떤 계정을 볼지는 세션이 정하므로 caller 가 넘길 것이 없다.
 */
import { useDetailQuery } from '@/api/required-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { profileDetailQueryOptions } from './queries';

export function useProfileDetail() {
  const { locale } = useLocale();
  return useDetailQuery(profileDetailQueryOptions(locale));
}
