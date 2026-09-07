/**
 * 제품 운영자 상태와 상세 액션에 필요한 입력의 구분을 정의한다.
 * UI 정책은 실제 API에서도 필요하지만 기존 OpenAPI 상태 enum과 이름이 같다고 가정하지 않는다.
 */
/**
 * Notion에서 확인한 제품 상태다. 기존 API 상태 코드와의 대응은 이 타입에서 추측하지 않는다.
 */
export type ManagerAccountStatus = 'awaiting' | 'rejected' | 'active' | 'inactive' | 'locked';

export type ManagerDetailActionRequest =
  | {
      readonly type: 'approve' | 'delete' | 'activate' | 'deactivate';
      readonly managerId: string;
    }
  | {
      readonly type: 'reject';
      readonly managerId: string;
      readonly reason: string;
    }
  | {
      readonly type: 'password' | 'unlock';
      readonly managerId: string;
      readonly password: string;
    }
  | {
      readonly type: 'reveal';
      readonly managerId: string;
      readonly operatorPassword: string;
    }
  | {
      readonly type: 'verifyWithdrawal';
      readonly managerId: string;
      readonly reason: string;
      readonly operatorPassword: string;
    };
