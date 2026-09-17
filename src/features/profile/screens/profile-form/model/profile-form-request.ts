import type { ProfileSettings } from '@/features/profile/model/profile';
import type { ProfileEditValues } from './profile-form-schema';

/**
 * 검증된 폼 값에서 저장 항목만 골라 담는다. `passwordEdit`·`passwordConfirm` 같은 UI 전용 필드는
 * 여기서 떨어진다 — `{ ...values }` 로 펼치지 않는 이유다. 체크박스를 끈 저장에는 비밀번호가 아예
 * 실리지 않는다. 아이디는 수정 불가라 본문에 없다.
 */
export function toProfileSettings(values: ProfileEditValues): ProfileSettings {
  return {
    name: values.name,
    phone: values.phone,
    email: values.email,
    organization: values.organization,
    ...(values.passwordEdit ? { password: values.password } : {}),
  };
}
