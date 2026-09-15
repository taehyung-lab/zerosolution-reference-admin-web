import type { PageRowSelection } from "@/shared/model/use-page-row-selection";
import { Checkbox } from "@/shared/ui/primitives/Checkbox";
import type { DataTableProps } from "./DataTable";

// 선택 상태는 usePageRowSelection이, 라벨과 선택 가능 조건은 업무가 소유한다.
export function selectionColumn<TRow extends object>({
  selection,
  pageLabel,
  rowLabel,
  isSelectable,
}: {
  readonly selection: PageRowSelection<TRow>;
  readonly pageLabel: string;
  readonly rowLabel: (row: TRow) => string;
  readonly isSelectable?: (row: TRow) => boolean;
}): DataTableProps<TRow>["columns"][number] {
  return {
    id: "selection",
    header: () => (
      <Checkbox
        aria-label={pageLabel}
        checked={selection.isAllChecked}
        indeterminate={selection.isMixed}
        onChange={(event) => selection.togglePage(event.target.checked)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={rowLabel(row.original)}
        checked={selection.isChecked(row.original)}
        disabled={isSelectable?.(row.original) === false}
        onChange={(event) =>
          selection.toggleRow(row.original, event.target.checked)
        }
      />
    ),
  };
}
