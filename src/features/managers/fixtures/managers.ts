/**
 * 제품 운영자 목록·상세·수정 초기값·옵션을 연결하는 예시 데이터다.
 * 실제 서버 상태나 권한 정책의 근거가 아니다. 조회 경계 전환 뒤 직접 소비를 제거하고 필요한 시나리오만 mock/테스트에 남긴다.
 */
import type { ManagerDetail } from "../api/manager-detail-contract";
import type { ManagerAccountStatus } from "../detail/manager-detail-actions";
import type { ManagerDirectoryRow } from "../model/manager";

/**
 * TRANSPLANT_PENDING_MANAGER_REFERENCE_INPUTS: 읽기 전용 시나리오 예시다. 실제 제품 데이터와 서버 변환이 연결되면 교체한다.
 */
const referenceStates = [
  "awaiting",
  "rejected",
  "active",
  "inactive",
  "locked",
] as const;
export const managerFixtures: readonly {
  readonly accountStatus: ManagerAccountStatus;
  readonly detail: ManagerDetail;
  readonly lastAccessAt: string;
}[] = Array.from({ length: 105 }, (_, index) => {
  const accountStatus = referenceStates[index % referenceStates.length]!;
  return {
    accountStatus,
    lastAccessAt: "2026-08-03T00:00:00Z",
    detail: {
      id:
        index < 5
          ? `example-${accountStatus}`
          : `example-${accountStatus}-${index + 1}`,
      name: `Example${index + 1}`,
      type: { id: "INTERNAL", name: "Example type" },
      permission: { id: 1, name: "Example permission" },
      phone: "010-0000-0000",
      email: `operator${index + 1}@example.com`,
      organization: "Example",
      createdAt: "2026-08-01T00:00:00Z",
      updatedAt: "2026-08-02T00:00:00Z",
      changeLogs: [],
    },
  };
});

export function findManagerFixture(managerId: string) {
  return managerFixtures.find((record) => record.detail.id === managerId);
}

export const managerRowFixtures: readonly ManagerDirectoryRow[] =
  managerFixtures.map(({ detail, accountStatus, lastAccessAt }) => ({
    id: detail.id ?? "",
    name: detail.name ?? "",
    type: detail.type?.name ?? "",
    organization: detail.organization ?? "",
    phone: detail.phone ?? "",
    email: detail.email ?? "",
    lastAccessAt,
    permission: detail.permission?.name ?? "",
    registrationRoute: "WEB",
    status: undefined,
    accountStatus,
    createdAt: detail.createdAt ?? "",
    updatedAt: detail.updatedAt ?? "",
  }));

export const managerTypeFixtures = [
  { value: "INTERNAL", label: "Example type" },
  { value: "SITE", label: "Example site type" },
] as const;

/** 권한마다 어떤 유형에서 쓰이는지를 함께 둔다. 목록 필터는 전체를, 등록·수정은 선택 유형의 권한만 쓴다. */
export const managerPermissionFixtures = [
  { value: "1", label: "Example permission", type: "INTERNAL" },
  { value: "2", label: "Example site permission", type: "SITE" },
] as const;
