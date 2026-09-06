import type { GetList8Params, GetPermissionsType } from '@/api/generated/models';
import { localizedQueryKey } from '@/api/query-key';

export const managerKeys = {
  all: (locale: string) => localizedQueryKey(locale, 'managers'),
  list: (locale: string, params: GetList8Params) =>
    [...managerKeys.all(locale), 'list', params] as const,
  detail: (locale: string, id: string) => [...managerKeys.all(locale), 'detail', id] as const,
  editDetail: (locale: string, id: string) =>
    [...managerKeys.all(locale), 'edit-detail', id] as const,
  typeOptions: (locale: string) => [...managerKeys.all(locale), 'type-options'] as const,
  permissionOptions: (locale: string, type: GetPermissionsType | undefined) =>
    [...managerKeys.all(locale), 'permission-options', type ?? null] as const,
  agencyOptions: (locale: string) => [...managerKeys.all(locale), 'agency-options'] as const,
};
