import type { ManagerListItem } from './manager';

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

export function toManagerListItem(
  manager: ManagerListItemSource
): ManagerListItem {
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
