/**
 * 기존 API 목록 행과 제품 운영자 목록 행의 표시 모델을 정의한다.
 * 두 모델의 필드·상태 의미가 달라 함께 존재한다. 실제 API 전환 시 제품 표시 모델과 서버 변환의 경계를 정리해야 한다.
 */
import type { ManagerAccountStatus } from "./account-status";

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
