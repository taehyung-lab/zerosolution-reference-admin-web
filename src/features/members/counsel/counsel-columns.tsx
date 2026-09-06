import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import type { TFunction } from "i18next";
import type { PageRowSelection } from "@/shared/lib/use-page-row-selection";
import { Checkbox } from "@/shared/ui/primitives/Checkbox";
import { formatMemberInstant } from "../model/format-member-instant";
import { maskMemberEmail, maskMemberPhone } from "../model/member-profile";
import type { CounselRow } from "../model/member-records";
import type { MemberRecordSearch } from "../records/member-record-search";

export function buildCounselColumns({
  t,
  selection,
  search,
  onSort,
  inquiryOptions,
}: {
  readonly t: TFunction<"members">;
  readonly selection: PageRowSelection<CounselRow>;
  readonly search: MemberRecordSearch;
  readonly onSort: (
    sortType: NonNullable<MemberRecordSearch["sortType"]>,
  ) => void;
  readonly inquiryOptions: readonly { value: string; label: string }[];
}): DataTableProps<CounselRow>["columns"] {
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
      id: "inquiryType",
      accessorKey: "inquiryType",
      header: t("secondary.fields.inquiryType"),
      cell: ({ row }) =>
        inquiryOptions.find(
          (option) => option.value === row.original.inquiryType,
        )?.label ?? row.original.inquiryType,
    },
    {
      id: "content",
      accessorKey: "content",
      header: t("secondary.fields.content"),
    },
    {
      id: "receivedAt",
      accessorKey: "receivedAt",
      cell: ({ row }) => formatMemberInstant(row.original.receivedAt),
      header: t("secondary.fields.receivedAt"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "receivedAt") === "receivedAt"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("receivedAt"),
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
      id: "answeredAt",
      accessorKey: "answeredAt",
      cell: ({ row }) => formatMemberInstant(row.original.answeredAt),
      header: t("secondary.fields.answeredAt"),
      meta: {
        sort: {
          direction:
            (search.sortType ?? "receivedAt") === "answeredAt"
              ? search.sortDirection === "asc"
                ? "ascending"
                : "descending"
              : undefined,
          onSort: () => onSort("answeredAt"),
        },
      },
    },
  ];
}
