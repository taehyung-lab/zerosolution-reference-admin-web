/**
 * 등록/수정 폼이 쓰는 서버 어휘를 이 경계에서만 노출한다.
 * `manager-list-contract` 와 같은 이유로, 폼·화면 코드는 generated 산출물을 직접 알지 않는다.
 */
export { MrManagerDTOCreateType as managerFormTypes } from '@/api/generated/models';

export type {
  MrManagerDTOCreateType as ManagerFormType,
  MrManagerDTOCreate as ManagerCreateRequest,
  MrManagerDTOUpdate as ManagerUpdateRequest,
  MrManagerDTOEditDetail as ManagerEditDetail,
  GetPermissionsType as ManagerPermissionScope,
} from '@/api/generated/models';
