/**
 * 기존 OpenAPI 운영자 상태를 번역 키와 Badge 색상으로 바꾸는 표시 규칙이다.
 * 실제 API에서도 표시 변환은 필요하나 제품 상태 전이나 액션 허용 여부를 이 규칙으로 추측하지 않는다.
 */
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
