/**
 * 활성 회원의 표시 컬럼·선택 checkbox·정렬 이벤트와 불량 회원 전용 컬럼을 구성한다.
 * 실제 API에서도 필요한 표시 책임이다. 정렬 callback은 조회 조건을 바꾸며 서버 결과 배열을 여기서 정렬하지 않는다.
 */
import { selectionColumn } from "@/shared/ui/patterns/selection-column";
import type { PageRowSelection } from "@/shared/lib/use-page-row-selection";
import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import type { TFunction } from "i18next";
import type { MemberListDefinition } from "../model/member-list-definition";
import type { MemberListRow } from "../model/member-row";
import type { MemberSearch } from "../model/search-schema";

type Column = DataTableProps<MemberListRow>["columns"][number];
type SortType = MemberSearch["sortType"];

export function buildMemberColumns({
  t,
  definition,
  sort,
  onSortChange,
  selection,
}: {
  readonly t: TFunction<"members">;
  readonly definition: MemberListDefinition;
  readonly sort: {
    readonly type: SortType;
    readonly direction: MemberSearch["sortDirection"];
  };
  readonly onSortChange: (sortType: SortType) => void;
  readonly selection: PageRowSelection<MemberListRow>;
}): DataTableProps<MemberListRow>["columns"] {
  const sortable = (sortType: SortType, column: Column): Column => ({
    ...column,
    meta: {
      sort: {
        direction:
          sort.type === sortType
            ? sort.direction === "asc"
              ? "ascending"
              : "descending"
            : undefined,
        onSort: () => onSortChange(sortType),
      },
    },
  });

  return [
    selectionColumn({
      selection,
      pageLabel: t("result.selectPage"),
      rowLabel: (row) => t("result.selectRow", { name: row.name }),
      isSelectable: (row) => row.selectable !== false,
    }),
    { id: "grade", header: t("columns.grade"), accessorKey: "grade" },
    sortable("signupMethod", {
      id: "signupMethod",
      header: t("columns.signupMethod"),
      accessorKey: "signupMethod",
    }),
    sortable("email", {
      id: "email",
      header: t("columns.email"),
      accessorKey: "email",
    }),
    sortable("name", {
      id: "name",
      header: t("columns.name"),
      accessorKey: "name",
    }),
    sortable("phone", {
      id: "phone",
      header: t("columns.phone"),
      accessorKey: "phone",
    }),
    {
      id: "accountStatus",
      header: t("columns.accountStatus"),
      accessorKey: "accountStatus",
    },
    sortable("joinedAt", {
      id: "joinedAt",
      header: t("columns.joinedAt"),
      accessorKey: "joinedAt",
    }),
    sortable("lastAccessedAt", {
      id: "lastAccessedAt",
      header: t("columns.lastAccessedAt"),
      accessorKey: "lastAccessedAt",
    }),
    ...(definition.restrictionColumn
      ? [
          {
            id: "restrictions",
            header: t("columns.restrictions"),
            cell: ({ row }: { row: { original: MemberListRow } }) =>
              row.original.restrictions.join(", "),
          },
        ]
      : []),
  ];
}
