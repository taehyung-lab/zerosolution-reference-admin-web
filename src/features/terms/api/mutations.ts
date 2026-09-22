import { mutationOptions } from '@tanstack/react-query';
import { scenarioRequest } from '@/api/scenario';
import type { UiLocale } from '@/shared/i18n/locale';
import { termsQueryKeys } from './keys';
import type { TermsBulkChange, TermsStatus, TermsWriteInput } from '../model/terms';

/**
 * 약관의 쓰기 전부. 원문이 적은 도달 조건(일괄변경은 미선택 거절 → 변경 확인, 선택복사는 미선택 거절,
 * 상태 전환·삭제는 확인 alert, 등록·수정은 검증 → 저장 확인)까지가 화면의 책임이고 그 다음이 여기다.
 *
 * TRANSPLANT_PENDING_TERMS_MUTATION: 이 저장소에는 서버 계약이 없어 `mutationFn` 은 도달만 기록하고
 * 성공으로 끝난다. endpoint 가 확정되면 그 함수 본문만 바꾼다. 성공 시 무효화할 캐시는
 * `meta.invalidates` 가 이미 선언한다.
 */
function invalidates(locale: UiLocale) {
  return { meta: { invalidates: [termsQueryKeys.all(locale)] } };
}

/** 일괄 상태 변경이 요청하는 입력. 대상은 stable ID 배열이고 값은 cascade leaf 하나다. */
export interface TermsBulkChangeRequest {
  readonly targetIds: readonly string[];
  readonly change: TermsBulkChange;
}

/** 결과 toolbar 의 `선택 ▾ + 변경`. 성공 뒤 목록을 무효화해 `변경 상태로 화면 갱신됨` 을 만든다. */
export function bulkChangeTermsMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<TermsBulkChangeRequest>('약관 일괄 게시 상태 변경'),
    ...invalidates(locale),
  });
}

/** 결과 toolbar 의 `선택복사`. 원문이 적은 도달 조건은 미선택 거절 alert 하나다. */
export function copyTermsMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly targetIds: readonly string[] }>('약관 선택복사'),
    ...invalidates(locale),
  });
}

/**
 * 11.2.2 조회 frame 의 `게시 상태` 행: 현재 값 옆에 반대 상태로 바꾸는 버튼 하나가 있다.
 * Notion 은 그 클릭에 상태 변경 확인 alert 을 적는다 — 확인을 지난 뒤가 여기다.
 */
export function updateTermsStatusMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly termsId: string; readonly status: TermsStatus }>('약관 게시 상태 변경'),
    ...invalidates(locale),
  });
}

/** 11.2.2 하단 `삭제`. 원문의 삭제 확인 alert(`삭제하시겠습니까?`)을 지난 뒤가 여기다. */
export function deleteTermsMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<string>('약관 삭제'),
    ...invalidates(locale),
  });
}

/** 11.2.3 등록 frame 하단 `저장`. */
export function createTermsMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<TermsWriteInput>('약관 등록'),
    ...invalidates(locale),
  });
}

/** 11.2.4 수정 frame 하단 `저장`. */
export function updateTermsMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly termsId: string; readonly input: TermsWriteInput }>('약관 수정'),
    ...invalidates(locale),
  });
}
