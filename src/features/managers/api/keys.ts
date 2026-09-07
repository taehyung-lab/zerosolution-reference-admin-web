/**
 * 운영자 목록·상세·수정 초기값·옵션의 locale/조건별 Query 캐시 주소를 정의한다.
 * 실제 API에서도 필요하며 같은 응답을 공유할 수 있는 조회만 같은 키를 사용한다.
 */
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
