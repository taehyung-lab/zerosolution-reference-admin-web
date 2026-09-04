import type { AsyncFieldState } from '@/shared/ui/patterns/AsyncFieldBoundary';
import type { ManagerPermissionScope } from '../api/manager-form-contract';
import { managerFormTypes } from '../api/manager-form-contract';
import {
  useManagerAgencyOptions,
  useManagerPermissionOptions,
  useManagerTypeOptions,
} from '../options/useManagerOptions';

export interface ManagerSelectOptions {
  readonly state: AsyncFieldState;
  readonly items: readonly { value: string; label: string }[];
  readonly retry: () => void;
}

export interface ManagerFormOptions {
  readonly isAgency: boolean;
  readonly typeSelected: boolean;
  readonly type: ManagerSelectOptions;
  readonly permission: ManagerSelectOptions;
  readonly agency: ManagerSelectOptions;
}

const noOptions: ManagerSelectOptions = { state: 'ready', items: [], retry: () => undefined };

function toSelectOptions(query: {
  readonly data?: readonly { value: string; label: string }[];
  readonly isError: boolean;
  readonly refetch: () => unknown;
}): ManagerSelectOptions {
  return {
    state: query.data !== undefined ? 'ready' : query.isError ? 'error' : 'loading',
    items: query.data ?? [],
    retry: () => void query.refetch(),
  };
}

/**
 * The three option queries of a manager form, projected to what a select renders. Permissions
 * belong to a type ("[설정 > 접근권한] 중 사용 상태이고 선택한 유형에 속한 권한", Notion), so they
 * are not requested until a type is chosen; the agency select only exists for the AGENCY type.
 * Clearing the dependent values when the type changes is the form's policy, wired at the type
 * select by the screen.
 */
export function useManagerFormOptions(type: string): ManagerFormOptions {
  const typeSelected = type !== '';
  const types = useManagerTypeOptions();
  const permissions = useManagerPermissionOptions(
    typeSelected ? (type as ManagerPermissionScope) : undefined
  );
  const agencies = useManagerAgencyOptions();
  return {
    isAgency: type === managerFormTypes.AGENCY,
    typeSelected,
    type: toSelectOptions(types),
    permission: typeSelected ? toSelectOptions(permissions) : noOptions,
    agency: toSelectOptions(agencies),
  };
}
