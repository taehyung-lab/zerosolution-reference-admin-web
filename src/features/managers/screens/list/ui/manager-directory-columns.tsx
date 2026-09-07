/**
 * 제품 운영자 목록의 컬럼 순서·표시값·정렬 헤더를 구성한다.
 * 정렬 가능한 컬럼 집합은 URL 정렬 enum과 같은 타입에서 나오므로 보기 정렬 목록과 헤더가 갈라지지 않는다.
 * 방향 표시는 활성 컬럼 하나에만 주고(aria-sort 한 개), 정렬 확정과 URL 전이는 결과 workflow가 소유한다.
 */
import type { PageRowSelection } from "@/shared/lib/use-page-row-selection";
import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import { selectionColumn } from "@/shared/ui/patterns/selection-column";
import type { TFunction } from "i18next";
import type { ManagerDirectoryRow } from "../../../model/manager";
import type { ManagerListSort } from "../model/manager-list-search";

/** Figma 11.1 table의 컬럼 순서다. 정렬 목록과 순서가 다르므로 별도로 선언한다. 타입은 허용된 필드만 받으며, 목록 테스트가 정렬 선택지와의 집합 일치를 검증한다. */
const managerDirectoryColumnFields: readonly ManagerListSort[] = [
  "type",
  "organization",
  "id",
  "name",
  "phone",
  "email",
  "permission",
  "registrationRoute",
  "accountStatus",
  "joinedAt",
  "lastAccessAt",
];

export function buildManagerDirectoryColumns({
  t,
  sort,
  direction,
  onSortChange,
  selection,
}: {
  readonly t: TFunction<"managers">;
  readonly sort: ManagerListSort;
  readonly direction: "asc" | "desc";
  readonly onSortChange: (field: ManagerListSort) => void;
  readonly selection: PageRowSelection<ManagerDirectoryRow>;
}): DataTableProps<ManagerDirectoryRow>["columns"] {
  return [
    selectionColumn({
      selection,
      pageLabel: t("result.selectAll"),
      rowLabel: (row) => t("result.selectRow", { id: row.id }),
    }),
    ...managerDirectoryColumnFields.map((field) => ({
      id: field,
      header: t(`scenarioSort.${field}`),
      meta: {
        sort: {
          direction:
            sort === field
              ? direction === "asc"
                ? ("ascending" as const)
                : ("descending" as const)
              : undefined,
          onSort: () => onSortChange(field),
        },
      },
      cell: ({ row }: { row: { original: ManagerDirectoryRow } }) =>
        managerDirectoryCell(row.original, field, t),
    })),
  ];
}

/** 계정 상태의 빈 값과 날짜의 하루 자리는 표시 규칙이므로 컬럼 옆에 둔다. */
function managerDirectoryCell(
  row: ManagerDirectoryRow,
  field: ManagerListSort,
  t: TFunction<"managers">,
) {
  if (field === "accountStatus")
    return row.accountStatus
      ? t(`accountStatus.${row.accountStatus}`)
      : t("detail.emptyValue");
  if (field === "joinedAt") return row.createdAt.slice(0, 10);
  if (field === "lastAccessAt") return row.lastAccessAt.slice(0, 10);
  return row[field];
}
