/**
 * 기존 운영자 목록에서 허용하는 화면 컬럼과 서버 정렬 필드의 대응을 정의한다.
 * API에서도 필요한 변환이며 생성 enum 전체를 사용자 정렬 옵션으로 노출하지 않는다.
 */
import type { DataTableSortDirection } from "@/shared/ui/patterns/DataTable";
import type {
  ManagerApiSortType,
  ManagerSortDirection,
} from "../../../api/manager-list-contract";

/**
 * 운영자 테이블의 컬럼 ID다. 표시 순서와 셀 렌더링은 manager-columns가 소유한다.
 */
export type ManagerColumnId =
  | "type"
  | "organization"
  | "id"
  | "name"
  | "phone"
  | "permission"
  | "registrationRoute"
  | "status"
  | "createdAt"
  | "updatedAt";

/**
 * URL·정렬 선택·컬럼 헤더가 노출할 정렬 항목의 단일 대응표다.
 * Figma 11.1에 기획사 컬럼/정렬 옵션이 없어 기존 API의 AGENCY 정렬은 노출하지 않는다.
 */
export const managerSortFields = {
  CREATED_AT: { columnId: "createdAt", labelKey: "columns.createdAt" },
  UPDATED_AT: { columnId: "updatedAt", labelKey: "columns.updatedAt" },
  TYPE: { columnId: "type", labelKey: "columns.type" },
  ID: { columnId: "id", labelKey: "columns.id" },
  NAME: { columnId: "name", labelKey: "columns.name" },
  ORGANIZATION: { columnId: "organization", labelKey: "columns.organization" },
  PERMISSION: { columnId: "permission", labelKey: "columns.permission" },
  STATUS: { columnId: "status", labelKey: "columns.status" },
} as const satisfies Partial<
  Record<
    ManagerApiSortType,
    { columnId: ManagerColumnId; labelKey: `columns.${ManagerColumnId}` }
  >
>;

export type ManagerSortType = keyof typeof managerSortFields;

export const managerSortTypes = Object.keys(
  managerSortFields,
) as readonly ManagerSortType[];

export interface ManagerSortState {
  readonly type: ManagerSortType;
  readonly direction: ManagerSortDirection;
}

/**
 * 현재 정렬 컬럼에만 방향을 제공한다. 다른 헤더는 aria-sort와 정렬 아이콘을 생략한다.
 */
export function sortDirectionFor(
  sort: ManagerSortState,
  sortType: ManagerSortType,
): DataTableSortDirection | undefined {
  if (sort.type !== sortType) return undefined;
  return sort.direction === "ASC" ? "ascending" : "descending";
}

export function sortTypeOfColumn(
  columnId: ManagerColumnId,
): ManagerSortType | undefined {
  return managerSortTypes.find(
    (type) => managerSortFields[type].columnId === columnId,
  );
}
