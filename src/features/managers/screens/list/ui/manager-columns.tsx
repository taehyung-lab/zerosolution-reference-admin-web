/**
 * 기존 API 운영자 목록의 행 표시·선택·상세 링크와 서버 정렬 요청 이벤트를 구성한다.
 * API 이후에도 컬럼 책임은 유지하며 서버 enum/표시값의 변경은 모델과 정렬 대응에서 대조한다.
 */
import type { PageRowSelection } from "@/shared/model/use-page-row-selection";
import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import { selectionColumn } from "@/shared/ui/patterns/selection-column";
import { Badge } from "@/shared/ui/primitives/Badge";
import { Link } from "@tanstack/react-router";
import type { TFunction } from "i18next";
import type { ManagerListItem } from "../../../model/manager";
import { managerStatusMeta } from "../../../model/status";
import {
  managerSortFields,
  sortDirectionFor,
  type ManagerSortState,
  type ManagerSortType,
} from "../model/manager-sort";

export type { ManagerSortState } from "../model/manager-sort";

type ManagerColumn = DataTableProps<ManagerListItem>["columns"][number];

/**
 * ColumnDef는 유니온이므로 일반 Omit이 accessorKey를 잃지 않도록 각 구성 타입에 분배해 적용한다.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;
type SortableColumnRest = DistributiveOmit<
  ManagerColumn,
  "id" | "header" | "meta"
>;

export function buildManagerColumns({
  t,
  formatDate,
  sort,
  onSortChange,
  selection,
}: {
  readonly t: TFunction<"managers">;
  readonly formatDate: (value: string) => string;
  readonly sort: ManagerSortState;
  readonly onSortChange: (sortType: ManagerSortType) => void;
  readonly selection: PageRowSelection<ManagerListItem>;
}): DataTableProps<ManagerListItem>["columns"] {
  /**
   * 정렬 컬럼의 ID·번역 키·정렬 표시를 단일 정렬 대응표에서 가져온다.
   */
  const sortable = (
    sortType: ManagerSortType,
    column: SortableColumnRest,
  ): ManagerColumn => {
    const field = managerSortFields[sortType];
    return {
      ...column,
      id: field.columnId,
      header: t(field.labelKey),
      meta: {
        sort: {
          direction: sortDirectionFor(sort, sortType),
          onSort: () => onSortChange(sortType),
        },
      },
    };
  };
  const dateCell = (value: string) => (value === "-" ? "-" : formatDate(value));

  return [
    selectionColumn({
      selection,
      pageLabel: t("result.selectAll"),
      rowLabel: (row) => t("result.selectRow", { id: row.id }),
    }),
    sortable("TYPE", { accessorKey: "type" }),
    sortable("ORGANIZATION", { accessorKey: "organization" }),
    sortable("ID", {
      cell: ({ row }) => (
        <Link
          className="underline"
          to="/managers/$managerId"
          params={{ managerId: row.original.id }}
        >
          {row.original.id}
        </Link>
      ),
    }),
    sortable("NAME", { accessorKey: "name" }),
    { id: "phone", header: t("columns.phone"), accessorKey: "phone" },
    sortable("PERMISSION", { accessorKey: "permission" }),
    {
      id: "registrationRoute",
      header: t("columns.registrationRoute"),
      accessorKey: "registrationRoute",
    },
    sortable("STATUS", {
      cell: ({ row }) => {
        const { labelKey, tone } = managerStatusMeta(row.original.status);
        return (
          <Badge tone={tone}>
            {row.original.accountStatus
              ? t(`accountStatus.${row.original.accountStatus}`)
              : t(labelKey)}
          </Badge>
        );
      },
    }),
    sortable("CREATED_AT", {
      cell: ({ row }) => dateCell(row.original.createdAt),
    }),
    sortable("UPDATED_AT", {
      cell: ({ row }) => dateCell(row.original.updatedAt),
    }),
  ];
}
