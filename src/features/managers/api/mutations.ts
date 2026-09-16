import { mutationOptions } from '@tanstack/react-query';
import { scenarioRequest } from '@/api/scenario';
import type { UiLocale } from '@/shared/i18n/locale';
import type {
  ManagerAction,
  ManagerBulkChangeRequest,
  ManagerCreateSettings,
  ManagerSettings,
} from '../model/manager';
import { managerQueryKeys } from './keys';

/**
 * 운영자의 쓰기. 등록·수정은 검증 → 저장 확인, 상세 액션은 각 상태가 허용한 확인·입력 절차, 일괄변경은
 * 선택 + 값 + 변경 확인까지가 화면의 책임이고 그 다음이 여기다.
 *
 * TRANSPLANT_PENDING_MANAGER_MUTATION: 이 저장소에는 서버 계약이 없어 `mutationFn` 은 도달만 기록하고
 * 성공으로 끝난다. endpoint 가 확정되면 그 함수 본문만 바꾼다. 성공 시 무효화할 캐시는
 * `meta.invalidates` 가 이미 선언한다. 비밀번호·사유는 로그에 싣지 않는다.
 */
function invalidates(locale: UiLocale) {
  return { meta: { invalidates: [managerQueryKeys.managers(locale)] } };
}

export function createManagerMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<ManagerCreateSettings>('운영자 등록'),
    ...invalidates(locale),
  });
}

export function updateManagerMutation(locale: UiLocale, managerId: string) {
  return mutationOptions({
    mutationFn: scenarioRequest<ManagerSettings>(`운영자 수정 ${managerId}`),
    ...invalidates(locale),
  });
}

const actionLabels: Readonly<Record<ManagerAction['type'], string>> = {
  approve: '운영자 가입 승인',
  reject: '운영자 가입 거절',
  delete: '운영자 삭제',
  activate: '운영자 활성화',
  deactivate: '운영자 비활성화',
  password: '운영자 비밀번호 변경',
  unlock: '운영자 잠금해제',
  reveal: '운영자 개인정보 조회 재인증',
  verifyWithdrawal: '운영자 탈퇴 재인증',
};

/** 상세 화면의 상태 액션 하나. 종류별 endpoint 는 미확인이라 한 함수가 종류를 받아 기록한다. */
export function managerActionMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: (action: ManagerAction) =>
      scenarioRequest<ManagerAction>(actionLabels[action.type])(action),
    ...invalidates(locale),
  });
}

export function bulkChangeManagersMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<ManagerBulkChangeRequest>('운영자 일괄변경'),
    ...invalidates(locale),
  });
}
