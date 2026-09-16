import type { ManagerCreateSettings, ManagerSettings } from '@/features/managers/model/manager';
import type { ManagerCreateValues, ManagerEditValues } from './manager-form-schema';

/**
 * 검증된 폼 값에서 저장 항목만 골라 담는다. `passwordConfirm` 같은 UI 전용 필드는 여기서 떨어진다 —
 * `{ ...values }` 로 펼치지 않는 이유다. 반환 타입 표기가 초과 속성을 typecheck 에서 거부한다.
 */
export function toManagerCreateSettings(values: ManagerCreateValues): ManagerCreateSettings {
  return {
    id: values.id,
    password: values.password,
    type: values.type,
    permissionId: values.permissionId,
    name: values.name,
    phone: values.phone,
    email: values.email,
    organization: values.organization,
  };
}

/** 아이디는 경로에 있고 비밀번호는 수정 frame 에 없다. 둘 다 본문에 싣지 않는다. */
export function toManagerSettings(values: ManagerEditValues): ManagerSettings {
  return {
    type: values.type,
    permissionId: values.permissionId,
    name: values.name,
    phone: values.phone,
    email: values.email,
    organization: values.organization,
  };
}
