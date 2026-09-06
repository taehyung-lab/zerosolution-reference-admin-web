import type { ManagerDetail } from "../api/manager-detail-contract";
import type { ManagerAccountStatus } from "../detail/manager-detail-actions";
import type { ManagerFormOptions } from "../form/useManagerFormOptions";
import type { ManagerDirectoryRow } from "../model/manager";

/** TRANSPLANT_PENDING_MANAGER_REFERENCE_INPUTS: read-only scenario examples, replaced by product data and wire mapping. */
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

export const managerPermissionFixtures = [
  { value: "1", label: "Example permission", type: "INTERNAL" },
  { value: "2", label: "Example site permission", type: "SITE" },
] as const;

export function managerOptionFixtures(type: string): ManagerFormOptions {
  const ready = (items: readonly { value: string; label: string }[]) => ({
    state: "ready" as const,
    items,
    retry: () => undefined,
  });
  return {
    isAgency: false,
    typeSelected: type !== "",
    type: ready([
      { value: "INTERNAL", label: "Example type" },
      { value: "SITE", label: "Example site type" },
    ]),
    permission: ready(
      managerPermissionFixtures.filter(
        (permission) => permission.type === type,
      ),
    ),
    agency: ready([]),
  };
}
