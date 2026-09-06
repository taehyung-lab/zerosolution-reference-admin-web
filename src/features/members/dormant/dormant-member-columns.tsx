import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import type { TFunction } from "i18next";
import type { PageRowSelection } from "@/shared/lib/use-page-row-selection";
import { Checkbox } from "@/shared/ui/primitives/Checkbox";
import { formatMemberInstant } from "../model/format-member-instant";
import { maskMemberEmail, maskMemberPhone } from "../model/member-profile";
import type { DormantMemberRow } from "../model/member-records";
import type { MemberRecordSearch } from "../records/member-record-search";
export function dormantMemberColumns({
  t,
  selection,
  search,
  onSort,
}: {
  t: TFunction<"members">;
  selection: PageRowSelection<DormantMemberRow>;
  search: MemberRecordSearch;
  onSort: (sortType: string) => void;
}) {
  const columns: DataTableProps<DormantMemberRow>["columns"] = [
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
    {
      id: "signupMethod",
      accessorKey: "signupMethod",
      header: t("columns.signupMethod"),
      cell: ({ row }) => t(`signup.${row.original.signupMethod}`),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "joinedAt") === "signupMethod"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("signupMethod"),
        },
      },
    },
    {
      id: "email",
      accessorKey: "email",
      cell: ({ row }) => maskMemberEmail(row.original.email),
      header: t("columns.email"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "joinedAt") === "email"
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
            (search.sortType ?? "joinedAt") === "name"
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
            (search.sortType ?? "joinedAt") === "phone"
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
      id: "joinedAt",
      accessorKey: "joinedAt",
      cell: ({ row }) => formatMemberInstant(row.original.joinedAt),
      header: t("columns.joinedAt"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "joinedAt") === "joinedAt"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("joinedAt"),
        },
      },
    },
    {
      id: "lastAccessedAt",
      accessorKey: "lastAccessedAt",
      cell: ({ row }) => formatMemberInstant(row.original.lastAccessedAt),
      header: t("columns.lastAccessedAt"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "joinedAt") === "lastAccessedAt"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("lastAccessedAt"),
        },
      },
    },
    {
      id: "dormantAt",
      accessorKey: "dormantAt",
      cell: ({ row }) => formatMemberInstant(row.original.dormantAt),
      header: t("secondary.fields.dormantAt"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "joinedAt") === "dormantAt"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("dormantAt"),
        },
      },
    },
  ];

  return columns;
}
