import type { ResolvedMemberRecordSearch } from "../../../mechanics/record-list/model/member-record-search";
/**
 * 상담 목록의 표시 필드·날짜/연락처 표시·선택 열과 가능한 정렬 이벤트를 정의한다.
 * 실제 API에서도 컬럼 책임은 유지한다. 서버가 마스킹한 값을 반환하는지는 응답 계약에서 확인하고 원본 주소를 추정하지 않는다.
 */
import { maskEmail, maskPhone } from "@/shared/lib/mask-contact";
import { headerSortDirection } from "@/shared/lib/list-sort";
import type { PageRowSelection } from "@/shared/model/use-page-row-selection";
import type { DataTableProps } from "@/shared/ui/list/DataTable";
import { selectionColumn } from "@/shared/ui/list/selection-column";
import type { TFunction } from "i18next";
import { formatMemberInstant } from "../../../lib/format-member-instant";

import type { MemberRecordSearch } from "../../../model/member-record-search";
import type { CounselRow } from "../../../model/member-records";

export function buildCounselColumns({
  t,
  selection,
  search,
  onSort,
  inquiryOptions,
}: {
  readonly t: TFunction<"members">;
  readonly selection: PageRowSelection<CounselRow>;
  readonly search: ResolvedMemberRecordSearch;
  readonly onSort: (
    sortType: NonNullable<MemberRecordSearch["sortType"]>,
  ) => void;
  readonly inquiryOptions: readonly { value: string; label: string }[];
}): DataTableProps<CounselRow>["columns"] {
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
          direction: headerSortDirection(
            { type: search.sortType, direction: search.sortDirection },
            "receivedAt",
          ),
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
          direction: headerSortDirection(
            { type: search.sortType, direction: search.sortDirection },
            "answeredAt",
          ),
          onSort: () => onSort("answeredAt"),
        },
      },
    },
  ];
}
