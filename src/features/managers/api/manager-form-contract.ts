/**
 * 기존 OpenAPI의 등록/수정 요청·수정 조회·권한 옵션 타입을 폼 연결부에 노출한다.
 * 화면 입력 타입과 서버 요청 타입을 구분하기 위한 경계이며 계약 교체 시 mapper와 함께 조정한다.
 */
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
