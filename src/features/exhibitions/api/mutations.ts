import { mutationOptions } from '@tanstack/react-query';
import { scenarioRequest } from '@/api/scenario';
import type { UiLocale } from '@/shared/i18n/locale';
import { bannerQueryKeys } from './keys';
import type { BannerBulkChange, BannerWriteInput } from '../model/banner';

/**
 * 배너의 쓰기 전부. 원문이 적은 도달 조건(일괄변경은 미선택 거절 → 변경 확인, 삭제는 확인 alert,
 * 등록·수정은 검증 → 저장 확인)까지가 화면의 책임이고 그 다음이 여기다.
 *
 * TRANSPLANT_PENDING_BANNER_MUTATION: 이 저장소에는 서버 계약이 없어 `mutationFn` 은 도달만 기록하고
 * 성공으로 끝난다. endpoint 가 확정되면 그 함수 본문만 바꾼다. 성공 시 무효화할 캐시는
 * `meta.invalidates` 가 이미 선언한다.
 */
function invalidates(locale: UiLocale) {
  return { meta: { invalidates: [bannerQueryKeys.all(locale)] } };
}

/** 일괄 상태 변경이 요청하는 입력. 대상은 stable ID 배열이고 값은 cascade leaf 하나다. */
export interface BannerBulkChangeRequest {
  readonly targetIds: readonly string[];
  readonly change: BannerBulkChange;
}

/** 결과 toolbar 의 `선택 ▾ + 변경`. 성공 뒤 목록을 무효화해 `변경 상태로 화면 갱신됨` 을 만든다. */
export function bulkChangeBannersMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<BannerBulkChangeRequest>('배너 일괄 게시 상태 변경'),
    ...invalidates(locale),
  });
}

/** 7.1.2 하단 `삭제`. 원문의 삭제 확인 alert(`삭제하시겠습니까?`)을 지난 뒤가 여기다. */
export function deleteBannerMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<string>('배너 삭제'),
    ...invalidates(locale),
  });
}

/**
 * 7.1.3 등록 frame 하단 `저장`. 결과는 새 배너 ID 다 — 원문이 저장 완료 뒤 `등록된 조회 화면으로 이동`
 * 을 적는다. 서버가 없는 동안 시나리오 요청은 ID 를 돌려주지 않으므로 화면이 그 경우를 목록으로 보낸다.
 */
export function createBannerMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<BannerWriteInput, { readonly id: string } | undefined>('배너 등록'),
    ...invalidates(locale),
  });
}

/** 7.1.4 수정 frame 하단 `저장`. */
export function updateBannerMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly bannerId: string; readonly input: BannerWriteInput }>('배너 수정'),
    ...invalidates(locale),
  });
}
