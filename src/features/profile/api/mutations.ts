import { mutationOptions } from '@tanstack/react-query';
import { scenarioRequest } from '@/api/scenario';
import type { UiLocale } from '@/shared/i18n/locale';
import type { ProfileAction, ProfileSettings } from '../model/profile';
import { profileQueryKeys } from './keys';

/**
 * 내정보의 쓰기. 수정은 검증 → 저장 확인, 비밀번호 변경·탈퇴는 각 alert 의 입력과 확인까지가 화면의
 * 책임이고 그 다음이 여기다.
 *
 * TRANSPLANT_PENDING_PROFILE_MUTATION: 이 저장소에는 서버 계약이 없어 `mutationFn` 은 도달만
 * 기록하고 성공으로 끝난다. endpoint 가 확정되면 그 함수 본문만 바꾼다. 비밀번호는 로그에 싣지 않는다.
 */
function invalidates(locale: UiLocale) {
  return { meta: { invalidates: [profileQueryKeys.profile(locale)] } };
}

export function updateProfileMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly settings: ProfileSettings }>('내정보 수정'),
    ...invalidates(locale),
  });
}

const actionLabels: Readonly<Record<ProfileAction['type'], string>> = {
  changePassword: '내정보 비밀번호 변경',
  withdraw: '내정보 탈퇴',
};

/** 조회 화면의 입력 액션 하나. 종류별 endpoint 는 미확인이라 한 함수가 종류를 받아 기록한다. */
export function profileActionMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: (action: ProfileAction) => scenarioRequest<ProfileAction>(actionLabels[action.type])(action),
    ...invalidates(locale),
  });
}
