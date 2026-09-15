import type { ResolvedMemberRecordSearch } from "../../../mechanics/record-list/model/member-record-search";
/**
 * 탈퇴 목록의 표시 필드·날짜/연락처 표시·선택 열과 가능한 정렬 이벤트를 정의한다.
 * 실제 API에서도 컬럼 책임은 유지한다. 서버가 마스킹한 값을 반환하는지는 응답 계약에서 확인하고 원본 주소를 추정하지 않는다.
 */
import { maskEmail } from "@/shared/lib/mask-contact";
import { headerSortDirection } from "@/shared/lib/list-sort";
import type { PageRowSelection } from "@/shared/model/use-page-row-selection";
import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import { selectionColumn } from "@/shared/ui/patterns/selection-column";
import type { TFunction } from "i18next";
import { formatMemberInstant } from "../../../lib/format-member-instant";

import type { MemberRecordSearch } from "../../../model/member-record-search";
import type { WithdrawnMemberRow } from "../../../model/member-records";
export function buildWithdrawnMemberListColumns({
  t,
  selection,
  search,
  onSort,
}: {
  readonly t: TFunction<"members">;
  readonly selection: PageRowSelection<WithdrawnMemberRow>;
  readonly search: ResolvedMemberRecordSearch;
  readonly onSort: (
    sortType: NonNullable<MemberRecordSearch["sortType"]>,
  ) => void;
}) {
  const columns: DataTableProps<WithdrawnMemberRow>["columns"] = [
    selectionColumn({
      selection,
      pageLabel: t("result.selectPage"),
      rowLabel: (row) => t("result.selectRow", { name: row.email }),
    }),
    {
      id: "signupMethod",
      accessorKey: "signupMethod",
      header: t("columns.signupMethod"),
      cell: ({ row }) => t(`signup.${row.original.signupMethod}`),
      meta: {
        sort: {
          direction: headerSortDirection(
            { type: search.sortType, direction: search.sortDirection },
            "signupMethod",
          ),
          onSort: () => onSort("signupMethod"),
        },
      },
    },
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
          direction: headerSortDirection(
            { type: search.sortType, direction: search.sortDirection },
            "joinedAt",
          ),
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
          direction: headerSortDirection(
            { type: search.sortType, direction: search.sortDirection },
            "withdrawnAt",
          ),
          onSort: () => onSort("withdrawnAt"),
        },
      },
    },
  ];

  return columns;
}
