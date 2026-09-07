/**
 * 폼이 필요한 옵션 조회들을 필드별 로딩·오류·재시도 상태와 유형 종속 정보로 조립한다.
 * 실제 API에서도 유지할 폼 연결부이며 목록 조회 성공 여부와 옵션 조회 생명주기를 묶지 않는다.
 */
import type { ManagerPermissionScope } from '../api/manager-form-contract';
import { managerFormTypes } from '../api/manager-form-contract';
import {
  noManagerSelectOptions,
  toManagerSelectOptions,
  type ManagerSelectOptions,
} from '../options/manager-select-options';
import {
  useManagerAgencyOptions,
  useManagerPermissionOptions,
  useManagerTypeOptions,
} from '../options/useManagerOptions';

export interface ManagerFormOptions {
  readonly isAgency: boolean;
  readonly typeSelected: boolean;
  readonly type: ManagerSelectOptions;
  readonly permission: ManagerSelectOptions;
  readonly agency: ManagerSelectOptions;
}

/**
 * 유형·권한·기획사 조회를 폼 필드별 상태로 변환한다.
 * Notion의 권한은 선택 유형에 종속되므로 유형 선택 전에는 조회하지 않는다.
 * 기획사 필드는 AGENCY에서만 표시한다. 유형 변경 시 종속값 초기화는 화면의 선택 이벤트가 소유한다.
 */
export function useManagerFormOptions(type: string): ManagerFormOptions {
  const typeSelected = type !== '';
  const types = useManagerTypeOptions();
  const permissions = useManagerPermissionOptions(
    typeSelected ? (type as ManagerPermissionScope) : undefined,
  );
  const agencies = useManagerAgencyOptions();
  return {
    isAgency: type === managerFormTypes.AGENCY,
    typeSelected,
    type: toManagerSelectOptions(types),
    permission: typeSelected ? toManagerSelectOptions(permissions) : noManagerSelectOptions,
    agency: toManagerSelectOptions(agencies),
  };
}
