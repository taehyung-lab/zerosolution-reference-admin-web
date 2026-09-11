import type { ResolvedMemberRecordSearch } from "../../../mechanics/record-list/model/member-record-search";
/**
 * 소명 목록의 표시 필드·날짜/연락처 표시·선택 열과 가능한 정렬 이벤트를 정의한다.
 * 실제 API에서도 컬럼 책임은 유지한다. 서버가 마스킹한 값을 반환하는지는 응답 계약에서 확인하고 원본 주소를 추정하지 않는다.
 */
import { maskEmail, maskPhone } from "@/shared/lib/mask-contact";
import { headerSortDirection } from "@/shared/lib/list-sort";
import type { PageRowSelection } from "@/shared/lib/use-page-row-selection";
import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import { selectionColumn } from "@/shared/ui/patterns/selection-column";
import type { TFunction } from "i18next";
import { formatMemberInstant } from "../../../lib/format-member-instant";

import type { MemberRecordSearch } from "../../../model/member-record-search";
import type { AppealRow } from "../../../model/member-records";

export function buildAppealColumns({
  t,
  selection,
  search,
  onSort,
}: {
  readonly t: TFunction<"members">;
  readonly selection: PageRowSelection<AppealRow>;
  readonly search: ResolvedMemberRecordSearch;
  readonly onSort: (
    sortType: NonNullable<MemberRecordSearch["sortType"]>,
  ) => void;
}): DataTableProps<AppealRow>["columns"] {
  return [
    selectionColumn({
      selection,
      pageLabel: t("result.selectPage"),
      rowLabel: (row) => t("result.selectRow", { name: row.email }),
    }),
    {
      id: "email",
      accessorKey: "email",
      header: t("columns.email"),
      cell: ({ row }) => maskEmail(row.original.email),
    },
    { id: "name", accessorKey: "name", header: t("columns.name") },
    {
      id: "phone",
      accessorKey: "phone",
      header: t("columns.phone"),
      cell: ({ row }) => maskPhone(row.original.phone),
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
          direction: headerSortDirection(
            { type: search.sortType, direction: search.sortDirection },
            "appliedAt",
          ),
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
          direction: headerSortDirection(
            { type: search.sortType, direction: search.sortDirection },
            "flaggedAt",
          ),
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
