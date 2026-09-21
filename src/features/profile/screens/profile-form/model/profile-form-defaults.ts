import type { ProfileDetail } from '@/features/profile/model/profile';
import type { ProfileEditInput } from './profile-form-schema';

/**
 * 수정 화면은 조회한 내 계정 값을 그대로 싣는다(Figma `13.2`). 비밀번호 `수정` 체크박스는
 * 원문대로 꺼진 채로 시작하고 두 입력은 빈 값이다.
 */
export function toProfileEditDefaults(detail: ProfileDetail): ProfileEditInput {
  return {
    passwordEdit: false,
    password: '',
    passwordConfirm: '',
    name: detail.name,
    phone: detail.phone,
    email: detail.email,
    organization: detail.organization,
  };
}
