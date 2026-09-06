import type { ManagerAccountStatus } from '../detail/manager-detail-actions';

export interface ManagerListItem {
  readonly accountStatus?: ManagerAccountStatus;
  readonly id: string;
  readonly type: string;
  readonly organization: string;
  readonly name: string;
  readonly phone: string;
  readonly permission: string;
  readonly registrationRoute: string;
  readonly status: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ManagerDirectoryRow extends ManagerListItem {
  readonly email: string;
  readonly lastAccessAt: string;
}
