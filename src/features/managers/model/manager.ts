export interface ManagerListItem {
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
