import type { DataTableSortDirection } from '@/shared/ui/patterns/DataTable';
import type {
  ManagerApiSortType,
  ManagerSortDirection,
} from '../api/manager-list-contract';

/** Column IDs the Managers table renders; order and cells stay in manager-columns. */
export type ManagerColumnId =
  | 'type'
  | 'organization'
  | 'id'
  | 'name'
  | 'phone'
  | 'permission'
  | 'registrationRoute'
  | 'status'
  | 'createdAt'
  | 'updatedAt';

/**
 * Single source of the exposed sort vocabulary: URL schema, sort select options, and sortable
 * column headers all derive from this table, so the option set and the header set cannot drift.
 * The rehearsal `AGENCY` key is deliberately absent because Figma 11.1 shows neither an agency
 * sort option nor an agency column (docs/reference/zero-sol-figma-analysis.md §6).
 */
export const managerSortFields = {
  CREATED_AT: { columnId: 'createdAt', labelKey: 'columns.createdAt' },
  UPDATED_AT: { columnId: 'updatedAt', labelKey: 'columns.updatedAt' },
  TYPE: { columnId: 'type', labelKey: 'columns.type' },
  ID: { columnId: 'id', labelKey: 'columns.id' },
  NAME: { columnId: 'name', labelKey: 'columns.name' },
  ORGANIZATION: { columnId: 'organization', labelKey: 'columns.organization' },
  PERMISSION: { columnId: 'permission', labelKey: 'columns.permission' },
  STATUS: { columnId: 'status', labelKey: 'columns.status' },
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

/** Only the active sort key gets a direction; every other header omits `aria-sort` and glyph. */
export function sortDirectionFor(
  sort: ManagerSortState,
  sortType: ManagerSortType,
): DataTableSortDirection | undefined {
  if (sort.type !== sortType) return undefined;
  return sort.direction === 'ASC' ? 'ascending' : 'descending';
}

export function sortTypeOfColumn(
  columnId: ManagerColumnId,
): ManagerSortType | undefined {
  return managerSortTypes.find(
    (type) => managerSortFields[type].columnId === columnId,
  );
}
