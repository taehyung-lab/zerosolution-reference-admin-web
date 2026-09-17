import { mutationOptions } from '@tanstack/react-query';
import { scenarioRequest } from '@/api/scenario';
import { localizedQueryKey } from '@/api/query-key';
import type { UiLocale } from '@/shared/i18n/locale';
import type { ContentBulkChangeRequest } from '../model/content';

/**
 * 공연 도메인의 쓰기. 검증 → 확인까지가 화면의 책임이고 그 다음이 여기다.
 *
 * TRANSPLANT_PENDING_CONTENT_MUTATION: 이 저장소에는 서버 계약이 없어 `mutationFn` 은 도달만 기록하고
 * 성공으로 끝난다. endpoint 가 확정되면 그 함수 본문만 바꾼다. 성공 시 무효화할 캐시는 `meta.invalidates`
 * 가 이미 선언한다.
 */
export function bulkChangeContentsMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<ContentBulkChangeRequest>('콘텐츠 사용상태 일괄변경'),
    meta: { invalidates: [localizedQueryKey(locale, 'performances', 'contents')] },
  });
}
