import { localizedQueryKey } from '@/api/query-key';
import type { ManagerListRequest } from '../model/manager';

/** 캐시 주소만 소유하는 leaf 모듈. 화면·model·query 를 import 하지 않는다. */
export const managerQueryKeys = {
  /** 운영자 계열 전체. 쓰기 성공 뒤 목록·상세를 함께 무효화하는 prefix 다. 옵션은 포함하지 않는다. */
  managers: (locale: string) => localizedQueryKey(locale, 'managers', 'records'),
  list: (locale: string, request: ManagerListRequest) =>
    [...localizedQueryKey(locale, 'managers', 'records', 'list'), request] as const,
  detail: (locale: string, managerId: string) =>
    [...localizedQueryKey(locale, 'managers', 'records', 'detail'), managerId] as const,
  typeOptions: (locale: string) => localizedQueryKey(locale, 'managers', 'options', 'types'),
  permissionOptions: (locale: string, type: string | undefined) =>
    [...localizedQueryKey(locale, 'managers', 'options', 'permissions'), type ?? 'all'] as const,
};
