/**
 * 제품 운영자 화면이 소비하는 임시 옵션 응답이다. 실제 옵션 endpoint·식별자 계약이 확정되면 Query의 공급 함수와 응답 매핑을 교체한다.
 * 로딩·실패·재시도 사실은 여기서 만들지 않는다. 그 사실은 Query와 옵션 훅이 소유한다.
 */
import { managerPermissionFixtures, managerTypeFixtures } from './managers';

export interface ManagerDirectoryOption {
  readonly value: string;
  readonly label: string;
}

export function readManagerDirectoryTypeOptions(): readonly ManagerDirectoryOption[] {
  return managerTypeFixtures.map(({ value, label }) => ({ value, label }));
}

/**
 * 목록 필터는 유형과 무관하게 사용 중인 전체 권한에서 하나를 고르고, 등록·수정만 선택한 유형에 종속된
 * 권한을 쓴다(`docs/reference/zero-sol/11-settings.md` 11.1 option-source select). `type === undefined`가
 * 목록 필터의 전체 범위다.
 */
export function readManagerDirectoryPermissionOptions(
  type: string | undefined,
): readonly ManagerDirectoryOption[] {
  return managerPermissionFixtures
    .filter((permission) => type === undefined || permission.type === type)
    .map(({ value, label }) => ({ value, label }));
}
