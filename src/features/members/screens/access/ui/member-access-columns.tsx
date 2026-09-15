import type { ResolvedMemberRecordSearch } from "../../../mechanics/record-list/model/member-record-search";
/**
 * 접속 목록의 표시 필드·날짜/연락처 표시·선택 열과 가능한 정렬 이벤트를 정의한다.
 * 실제 API에서도 컬럼 책임은 유지한다. 서버가 마스킹한 값을 반환하는지는 응답 계약에서 확인하고 원본 주소를 추정하지 않는다.
 */
import { maskEmail, maskPhone } from "@/shared/lib/mask-contact";
import { headerSortDirection } from "@/shared/lib/list-sort";
import type { PageRowSelection } from "@/shared/model/use-page-row-selection";
import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import { selectionColumn } from "@/shared/ui/patterns/selection-column";
import type { TFunction } from "i18next";
import { formatMemberInstant } from "../../../lib/format-member-instant";

import type { MemberRecordSearch } from "../../../model/member-record-search";
import type { MemberAccessRow } from "../../../model/member-records";
export function buildMemberAccessListColumns({
  t,
  selection,
  search,
  onSort,
}: {
  readonly t: TFunction<"members">;
  readonly selection: PageRowSelection<MemberAccessRow>;
  readonly search: ResolvedMemberRecordSearch;
  readonly onSort: (
    sortType: NonNullable<MemberRecordSearch["sortType"]>,
  ) => void;
}) {
  const columns: DataTableProps<MemberAccessRow>["columns"] = [
    selectionColumn({
      selection,
      pageLabel: t("result.selectPage"),
      rowLabel: (row) => t("result.selectRow", { name: row.email }),
    }),
    { id: "grade", accessorKey: "grade", header: t("columns.grade") },
    {
      id: "email",
      accessorKey: "email",
      cell: ({ row }) => maskEmail(row.original.email),
      header: t("columns.email"),
      meta: {
        sort: {
          direction: headerSortDirection(
            { type: search.sortType, direction: search.sortDirection },
            "email",
          ),
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
          direction: headerSortDirection(
            { type: search.sortType, direction: search.sortDirection },
            "name",
          ),
          onSort: () => onSort("name"),
        },
      },
    },
    {
      id: "phone",
      accessorKey: "phone",
      cell: ({ row }) => maskPhone(row.original.phone),
      header: t("columns.phone"),
      meta: {
        sort: {
          direction: headerSortDirection(
            { type: search.sortType, direction: search.sortDirection },
            "phone",
          ),
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
          direction: headerSortDirection(
            { type: search.sortType, direction: search.sortDirection },
            "accessedAt",
          ),
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
