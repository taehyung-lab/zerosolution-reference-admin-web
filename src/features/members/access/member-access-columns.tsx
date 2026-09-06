import type { TFunction } from "i18next";
import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import type { PageRowSelection } from "@/shared/lib/use-page-row-selection";
import { Checkbox } from "@/shared/ui/primitives/Checkbox";
import { formatMemberInstant } from "../model/format-member-instant";
import { maskMemberEmail, maskMemberPhone } from "../model/member-profile";
import type { MemberAccessRow } from "../model/member-records";
import type { MemberRecordSearch } from "../records/member-record-search";
export function buildMemberAccessListColumns({
  t,
  selection,
  search,
  onSort,
}: {
  readonly t: TFunction<"members">;
  readonly selection: PageRowSelection<MemberAccessRow>;
  readonly search: MemberRecordSearch;
  readonly onSort: (
    sortType: NonNullable<MemberRecordSearch["sortType"]>,
  ) => void;
}) {
  const columns: DataTableProps<MemberAccessRow>["columns"] = [
    {
      id: "selection",
      header: () => (
        <Checkbox
          aria-label={t("result.selectPage")}
          checked={selection.isAllChecked}
          indeterminate={selection.isMixed}
          onChange={(event) => selection.togglePage(event.target.checked)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t("result.selectRow", { name: row.original.email })}
          checked={selection.isChecked(row.original)}
          onChange={(event) =>
            selection.toggleRow(row.original, event.target.checked)
          }
        />
      ),
    },
    { id: "grade", accessorKey: "grade", header: t("columns.grade") },
    {
      id: "email",
      accessorKey: "email",
      cell: ({ row }) => maskMemberEmail(row.original.email),
      header: t("columns.email"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "accessedAt") === "email"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("email"),
        },
      },
    },
    {
      id: "name",
      accessorKey: "name",
      header: t("columns.name"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "accessedAt") === "name"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("name"),
        },
      },
    },
    {
      id: "phone",
      accessorKey: "phone",
      cell: ({ row }) => maskMemberPhone(row.original.phone),
      header: t("columns.phone"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "accessedAt") === "phone"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("phone"),
        },
      },
    },
    {
      id: "accountStatus",
      accessorKey: "accountStatus",
      header: t("columns.accountStatus"),
      cell: ({ row }) => t(`accountStatus.${row.original.accountStatus}`),
    },
    {
      id: "accessedAt",
      accessorKey: "accessedAt",
      cell: ({ row }) => formatMemberInstant(row.original.accessedAt),
      header: t("secondary.fields.accessedAt"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "accessedAt") === "accessedAt"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("accessedAt"),
        },
      },
    },
    {
      id: "accessPath",
      accessorKey: "accessPath",
      header: t("secondary.fields.accessPath"),
      cell: () => t("secondary.fields.app"),
    },
  ];

  return columns;
}
