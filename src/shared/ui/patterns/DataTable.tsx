import { tableFeatures, useTable, type ColumnDef } from '@tanstack/react-table';
import { Table, TableCell, TableHead } from '../primitives/Table';

/** Active-sort `aria-sort` vocabulary; shared UI knows no server sort key. */
export type DataTableSortDirection = 'ascending' | 'descending';

/**
 * Controlled sort surface for one column. The caller owns which columns are sortable, the
 * current direction, and what activation changes (field, direction, page). DataTable renders
 * the header content inside one button, sets `<th aria-sort>` and draws the direction glyph
 * from the same `direction`, and calls `onSort` on activation. Sortable header content must
 * be non-interactive because it is rendered inside that button.
 *
 * `direction` is set only on the active sort column. WAI-ARIA 1.2 applies `aria-sort` to one
 * header at a time, so an inactive sortable header leaves it undefined and renders a button
 * with no `aria-sort` and no glyph; the ARIA value `none` is deliberately not modeled.
 */
export interface DataTableColumnSort {
  readonly direction?: DataTableSortDirection;
  readonly onSort: () => void;
}

export interface DataTableColumnMeta {
  readonly sort?: DataTableColumnSort;
}

/** Type-only slot: TanStack strips the value and keeps the type (`TableFeatures.columnMeta`). */
const columnMeta: DataTableColumnMeta = {};
const features = tableFeatures({ columnMeta });

export interface DataTableProps<TData extends object> {
  readonly rows: readonly TData[];
  readonly columns: readonly ColumnDef<typeof features, TData, unknown>[];
  readonly getRowId: (row: TData) => string;
}

/** The ▲▼ pair appears only on the active sort; the active arrow is emphasized. */
function SortGlyph({ direction }: { readonly direction: DataTableSortDirection | undefined }) {
  if (direction === undefined) return null;
  const active = 'text-neutral-900';
  const inactive = 'text-neutral-300';
  return (
    <span
      aria-hidden="true"
      className="inline-flex flex-col text-[0.55rem] leading-none"
      data-direction={direction}
    >
      <span className={direction === 'ascending' ? active : inactive}>▲</span>
      <span className={direction === 'descending' ? active : inactive}>▼</span>
    </span>
  );
}

export function DataTable<TData extends object>({
  rows,
  columns,
  getRowId,
}: DataTableProps<TData>) {
  const table = useTable({
    features,
    data: rows,
    columns: [...columns],
    getRowId,
  });
  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                if (header.isPlaceholder) return <TableHead key={header.id} />;
                const sort = header.column.columnDef.meta?.sort;
                if (sort === undefined) {
                  return (
                    <TableHead key={header.id}>
                      <table.FlexRender header={header} />
                    </TableHead>
                  );
                }
                return (
                  <TableHead aria-sort={sort.direction} key={header.id}>
                    <button
                      className="inline-flex items-center gap-1"
                      type="button"
                      onClick={sort.onSort}
                    >
                      <table.FlexRender header={header} />
                      <SortGlyph direction={sort.direction} />
                    </button>
                  </TableHead>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
