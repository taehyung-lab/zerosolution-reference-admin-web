import type { ManagerDetail } from '@/features/managers/model/manager';
import type { ManagerCreateInput, ManagerEditInput } from './manager-form-schema';

/** 등록의 빈 초기값(Figma 11.1.3): 유형·권한은 `선택`, 나머지는 빈 입력이다. */
export const managerCreateDefaults: ManagerCreateInput = {
  type: '',
  permissionId: '',
  id: '',
  password: '',
  passwordConfirm: '',
  name: '',
  phone: '',
  email: '',
  organization: '',
};

/** 수정 화면은 조회한 운영자의 값을 그대로 싣는다(Figma 11.1.4). 유형·권한은 식별자만 폼 값이 된다. */
export function toManagerEditDefaults(detail: ManagerDetail): ManagerEditInput {
  return {
    type: detail.type.value,
    permissionId: detail.permission.value,
    name: detail.name,
    phone: detail.phone,
    email: detail.email,
    organization: detail.organization,
  };
}
