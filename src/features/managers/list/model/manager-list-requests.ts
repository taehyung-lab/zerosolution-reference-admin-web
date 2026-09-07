import type { ManagerListActionRequest } from './useManagerListActions';

// TRANSPLANT_PENDING_MANAGER_LIST_ACTIONS: 실제 일괄변경 API 계약이 확정되면 이 함수를 교체한다.
// 대기·거절·잠금 대상을 제외하고 확인을 마친 요청만 받는다. 상태 변경과 성공 알림은 API 연결 뒤 처리한다.
export const requestManagerBulkChange: (request: ManagerListActionRequest) => void = () => {
  console.log('[시나리오] 운영자 일괄변경: 요청 입력 확인 → API 연결 대기');
};
