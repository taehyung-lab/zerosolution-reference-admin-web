/**
 * 기존 API 운영자 목록 응답을 행 표시 모델로 변환하고 누락 필드의 표시값을 정한다.
 * 실제 API에서도 필요한 응답 변환이며 서버 enum과 화면 라벨 대응은 계약 교체 때 함께 확인한다.
 */
import type { ManagerListItem } from '../../../model/manager';

const emptyValue = '-';

interface ManagerListItemSource {
  readonly id?: string;
  readonly type?: { readonly name?: string };
  readonly organization?: string;
  readonly agency?: { readonly name?: string };
  readonly name?: string;
  readonly phone?: string;
  readonly permission?: { readonly name?: string };
  readonly registrationRoute?: { readonly name?: string };
  readonly status?: { readonly id?: string };
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export function toManagerListItem(manager: ManagerListItemSource): ManagerListItem {
  return {
    id: manager.id ?? emptyValue,
    type: manager.type?.name ?? emptyValue,
    organization: manager.organization ?? manager.agency?.name ?? emptyValue,
    name: manager.name ?? emptyValue,
    phone: manager.phone ?? emptyValue,
    permission: manager.permission?.name ?? emptyValue,
    registrationRoute: manager.registrationRoute?.name ?? emptyValue,
    status: manager.status?.id,
    createdAt: manager.createdAt ?? emptyValue,
    updatedAt: manager.updatedAt ?? emptyValue,
  };
}
