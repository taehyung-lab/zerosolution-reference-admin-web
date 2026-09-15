import { formatDate } from "@/shared/lib/datetime";
import { headerSortDirection } from "@/shared/lib/list-sort";
import type { DataTableProps } from "@/shared/ui/list/DataTable";
import type { TFunction } from "i18next";
import type { PerformanceRow } from "../../../model/performance";
import { type PerformanceSearch } from "../../../model/performance-search";
import {
  performanceSortTypes,
  type ResolvedPerformanceSearch,
} from "../model/search-schema";

export function performanceColumns({
  t,
  search,
  total,
  onSort,
}: {
  readonly t: TFunction<"performances">;
  readonly search: ResolvedPerformanceSearch;
  readonly total: number;
  readonly onSort: (field: PerformanceSearch["sortType"]) => void;
}): DataTableProps<PerformanceRow>["columns"] {
  const fields = [
    "ticketKind",
    "performanceType",
    "title",
    "sessionCount",
    "performers",
    "organizer",
    "period",
    "venueName",
    "seller",
    "updatedAt",
  ] as const;
  const active = { type: search.sortType, direction: search.sortDirection };
  return [
    {
      id: "number",
      header: t("fields.number"),
      cell: ({ row }) =>
        total - (search.page - 1) * search.pageSize - row.index,
    },
    ...fields.map((field) => {
      const sortType = performanceSortTypes.find((value) => value === field);
      return {
        id: field,
        accessorKey: field,
        header: t(`fields.${field}`),
        cell: ({ row }: { row: { original: PerformanceRow } }) => {
          const value = row.original[field];
          if (field === "updatedAt") return formatDate(String(value));
          if (
            field === "ticketKind" ||
            field === "performanceType" ||
            field === "seller"
          )
            return t(`options.${value}`);
          return value;
        },
        ...(sortType === undefined
          ? {}
          : {
              meta: {
                sort: {
                  direction: headerSortDirection(active, sortType),
                  onSort: () => onSort(sortType),
                },
              },
            }),
      };
    }),
  ];
}
