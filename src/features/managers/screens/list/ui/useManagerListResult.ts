/**
 * 기존 API 운영자 목록의 선택 상태·컬럼·건수와 정렬/페이지 변경을 조립한다.
 * 실제 API에서도 필요한 표시/조작 책임이며 데이터 요청과 서버 행 정렬은 수행하지 않는다.
 */
import { formatDate } from "@/shared/lib/datetime";
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import type { DataTableProps } from "@/shared/ui/patterns/DataTable";
import { useTranslation } from "react-i18next";
import { type ManagerSearch } from "../../../api/manager-search";
import type { ManagerListItem } from "../../../model/manager";
import {
  changeManagerPageSize,
  goToManagerPage,
  managerPageSizeOptions,
  selectManagerSort,
} from "../model/manager-list-policy";
import {
  managerSortFields,
  managerSortTypes,
  type ManagerSortType,
} from "../model/manager-sort";
import {
  toManagerRouteSearch,
  type ManagerRouteSearch,
} from "../model/search-schema";
import type { ManagerListData } from "../model/useManagerListData";
import { buildManagerColumns } from "./manager-columns";

export function useManagerListResult({
  search,
  data,
  onSearchChange,
}: {
  readonly search: ManagerSearch;
  readonly data: ManagerListData;
  readonly onSearchChange: (next: ManagerRouteSearch) => void;
}) {
  const { t } = useTranslation("managers");
  const applySearch = (next: ManagerSearch) =>
    onSearchChange(toManagerRouteSearch(next));
  const changeSort = (sortType: ManagerSortType) =>
    applySearch(selectManagerSort(search, sortType));
  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(toManagerRouteSearch(search)),
  });

  const columns: DataTableProps<ManagerListItem>["columns"] =
    buildManagerColumns({
      t,
      formatDate,
      sort: { type: search.sortType, direction: search.sortDirection },
      onSortChange: changeSort,
      selection,
    });

  return {
    selectedIds: selection.selectedIds,
    columns,
    pageSize: {
      value: search.pageSize,
      options: managerPageSizeOptions,
      onValueChange: (pageSize: number) =>
        applySearch(changeManagerPageSize(search, pageSize)),
    },
    sort: {
      value: search.sortType,
      options: managerSortTypes.map((type) => ({
        value: type,
        label: t(managerSortFields[type].labelKey),
      })),
      onValueChange: changeSort,
    },
    pagination: {
      page: search.page,
      totalPages: data.totalPages,
      onPageChange: (page: number) =>
        applySearch(goToManagerPage(search, page)),
    },
  };
}
