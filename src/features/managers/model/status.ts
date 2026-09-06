export const managerStatuses = ['AWAITING', 'ACTIVE', 'LOCKED', 'INACTIVE'] as const;
export type ManagerStatus = (typeof managerStatuses)[number];

export function managerStatusMeta(status: string | undefined): {
  labelKey: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
} {
  switch (status) {
    case 'AWAITING':
      return {
        labelKey: 'status.awaiting',
        tone: 'warning',
      };
    case 'ACTIVE':
      return {
        labelKey: 'status.active',
        tone: 'success',
      };
    case 'LOCKED':
      return {
        labelKey: 'status.locked',
        tone: 'danger',
      };
    case 'INACTIVE':
      return {
        labelKey: 'status.inactive',
        tone: 'neutral',
      };
    default:
      return {
        labelKey: 'status.unknown',
        tone: 'neutral',
      };
  }
}
