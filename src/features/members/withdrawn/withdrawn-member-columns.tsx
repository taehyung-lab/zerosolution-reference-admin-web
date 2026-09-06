import type { TFunction } from "i18next";
import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import type { PageRowSelection } from "@/shared/lib/use-page-row-selection";
import { Checkbox } from "@/shared/ui/primitives/Checkbox";
import { formatMemberInstant } from "../model/format-member-instant";
import { maskMemberEmail } from "../model/member-profile";
import type { WithdrawnMemberRow } from "../model/member-records";
import type { MemberRecordSearch } from "../records/member-record-search";
export function buildWithdrawnMemberListColumns({
  t,
  selection,
  search,
  onSort,
}: {
  readonly t: TFunction<"members">;
  readonly selection: PageRowSelection<WithdrawnMemberRow>;
  readonly search: MemberRecordSearch;
  readonly onSort: (
    sortType: NonNullable<MemberRecordSearch["sortType"]>,
  ) => void;
}) {
  const columns: DataTableProps<WithdrawnMemberRow>["columns"] = [
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
            (search.sortType ?? "withdrawnAt") === "signupMethod"
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
            (search.sortType ?? "withdrawnAt") === "email"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("email"),
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
            (search.sortType ?? "withdrawnAt") === "joinedAt"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("joinedAt"),
        },
      },
    },
    {
      id: "withdrawnAt",
      accessorKey: "withdrawnAt",
      cell: ({ row }) => formatMemberInstant(row.original.withdrawnAt),
      header: t("secondary.fields.withdrawnAt"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "withdrawnAt") === "withdrawnAt"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("withdrawnAt"),
        },
      },
    },
  ];

  return columns;
}
