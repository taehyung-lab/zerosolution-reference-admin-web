import { queryOptions } from '@tanstack/react-query';
import type { UiLocale } from '@/shared/i18n/locale';
import { readProfileDetail } from '../fixtures/profile';
import { profileQueryKeys } from './keys';

/**
 * 내 계정 한 건. 조회 화면과 수정 화면, 두 route loader 가 같은 정의를 쓴다. 대상은 세션이 정하므로
 * 인자가 locale 뿐이다.
 *
 * TRANSPLANT_PENDING_PROFILE_QUERY: queryFn 은 아직 임시 응답 함수다. 실제 endpoint 가 확정되면
 * 여기서 생성된 operation 을 호출하고 fixtures 를 지운다.
 */
export function profileDetailQueryOptions(locale: UiLocale) {
  return queryOptions({
    queryKey: profileQueryKeys.detail(locale),
    queryFn: () => readProfileDetail(),
  });
}
