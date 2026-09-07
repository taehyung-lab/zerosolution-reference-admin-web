/**
 * 휴면 목록의 표시 필드·날짜/연락처 표시·선택 열과 가능한 정렬 이벤트를 정의한다.
 * 실제 API에서도 컬럼 책임은 유지한다. 서버가 마스킹한 값을 반환하는지는 응답 계약에서 확인하고 원본 주소를 추정하지 않는다.
 */
import { selectionColumn } from "@/shared/ui/patterns/selection-column";
import { maskEmail, maskPhone } from "@/shared/lib/mask-contact";
import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import type { TFunction } from "i18next";
import type { PageRowSelection } from "@/shared/lib/use-page-row-selection";
import { formatMemberInstant } from "../model/format-member-instant";

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
      cell: ({ row }) => maskEmail(row.original.email),
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
      cell: ({ row }) => maskPhone(row.original.phone),
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
