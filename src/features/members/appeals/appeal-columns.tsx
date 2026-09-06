import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import type { TFunction } from "i18next";
import type { PageRowSelection } from "@/shared/lib/use-page-row-selection";
import { Checkbox } from "@/shared/ui/primitives/Checkbox";
import { formatMemberInstant } from "../model/format-member-instant";
import { maskMemberEmail, maskMemberPhone } from "../model/member-profile";
import type { AppealRow } from "../model/member-records";
import type { MemberRecordSearch } from "../records/member-record-search";

export function buildAppealColumns({
  t,
  selection,
  search,
  onSort,
}: {
  readonly t: TFunction<"members">;
  readonly selection: PageRowSelection<AppealRow>;
  readonly search: MemberRecordSearch;
  readonly onSort: (
    sortType: NonNullable<MemberRecordSearch["sortType"]>,
  ) => void;
}): DataTableProps<AppealRow>["columns"] {
  return [
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
      id: "email",
      accessorKey: "email",
      header: t("columns.email"),
      cell: ({ row }) => maskMemberEmail(row.original.email),
    },
    { id: "name", accessorKey: "name", header: t("columns.name") },
    {
      id: "phone",
      accessorKey: "phone",
      header: t("columns.phone"),
      cell: ({ row }) => maskMemberPhone(row.original.phone),
    },
    {
      id: "accountStatus",
      accessorKey: "accountStatus",
      header: t("columns.accountStatus"),
      cell: ({ row }) => t(`accountStatus.${row.original.accountStatus}`),
    },
    {
      id: "appliedAt",
      accessorKey: "appliedAt",
      cell: ({ row }) => formatMemberInstant(row.original.appliedAt),
      header: t("secondary.fields.appliedAt"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "appliedAt") === "appliedAt"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("appliedAt"),
        },
      },
    },
    {
      id: "flaggedAt",
      accessorKey: "flaggedAt",
      cell: ({ row }) => formatMemberInstant(row.original.flaggedAt),
      header: t("secondary.fields.flaggedAt"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "appliedAt") === "flaggedAt"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("flaggedAt"),
        },
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: t("secondary.fields.status"),
      cell: ({ row }) => t(`secondary.states.${row.original.status}`),
    },
    {
      id: "result",
      accessorKey: "result",
      header: t("secondary.fields.result"),
      cell: ({ row }) => t(`secondary.states.${row.original.result}`),
    },
  ];
}
