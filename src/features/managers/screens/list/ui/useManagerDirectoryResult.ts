import type { useManagerDirectoryData } from "../model/useManagerDirectoryData";
/**
 * 제품 운영자 목록의 선택 수명·컬럼·보기 설정과 정렬·페이지의 URL 확정을 소유한다.
 * 조회 실행과 서버 행 정렬은 하지 않는다. 헤더 정렬은 같은 컬럼을 다시 누를 때만 방향을 뒤집고,
 * 보기 정렬 선택은 방향을 유지한다(Figma에 방향 컨트롤이 없다).
 */
import { standardPageSizeOptions } from "@/shared/config/list";
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import { useTranslation } from "react-i18next";
import { type ManagerListSearch } from "../../../model/manager-list-search";
import {
  type ResolvedManagerListSearch,
  type ManagerListRouteSearch,
  managerListSearchSchema,
  managerListSorts,
  type ManagerListSort,
} from "../model/manager-list-search";
import { buildManagerDirectoryColumns } from "./manager-directory-columns";

export function useManagerDirectoryResult({
  search,
  data,
  onSearchChange,
}: {
  readonly search: ResolvedManagerListSearch;
  readonly data: ReturnType<typeof useManagerDirectoryData>;
  readonly onSearchChange: (next: ManagerListRouteSearch) => void;
}) {
  const { t } = useTranslation("managers");
  const commit = (next: ManagerListSearch) =>
    onSearchChange(managerListSearchSchema.parse(next));
  const resolved = search;
  const { sort, direction } = resolved;
  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const columns: DataTableProps<(typeof data.rows)[number]>["columns"] =
    buildManagerDirectoryColumns({
      t,
      sort,
      direction,
      selection,
      onSortChange: (field) =>
        commit({
          ...search,
          sort: field,
          direction: sort === field && direction === "desc" ? "asc" : "desc",
          page: undefined,
        }),
    });

  return {
    columns,
    selectedIds: selection.selectedIds,
    pageSize: {
      value: resolved.pageSize,
      options: standardPageSizeOptions,
      onValueChange: (pageSize: number) =>
        commit({ ...search, pageSize, page: undefined }),
    },
    sort: {
      value: sort,
      options: managerListSorts.map((value) => ({
        value,
        label: t(`scenarioSort.${value}`),
      })),
      onValueChange: (value: ManagerListSort) =>
        commit({ ...search, sort: value, page: undefined }),
    },
    pagination: {
      page: data.page,
      totalPages: data.totalPages,
      onPageChange: (page: number) => commit({ ...search, page }),
    },
  };
}
