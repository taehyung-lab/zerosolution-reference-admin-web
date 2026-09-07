import { standardPageSizeOptions } from "@/shared/config/list";
import { useTranslation } from "react-i18next";
import {
  performanceSearchSchema,
  performanceSortTypes,
  resolvePerformanceSearch,
  type PerformanceRouteSearch,
} from "../model/search-schema";
import type { usePerformanceListData } from "../model/usePerformanceListData";
import { performanceColumns } from "./performance-columns";

export function usePerformanceListResult(
  search: PerformanceRouteSearch,
  data: ReturnType<typeof usePerformanceListData>,
  onChange: (next: PerformanceRouteSearch) => void,
) {
  const { t } = useTranslation("performances");
  const resolved = resolvePerformanceSearch(search);
  const change = (patch: PerformanceRouteSearch) =>
    onChange(performanceSearchSchema.parse({ ...search, ...patch }));

  return {
    columns: performanceColumns({
      t,
      search: resolved,
      total: data.total,
      onSort: (sortType) =>
        change({
          sortType,
          sortDirection:
            resolved.sortType === sortType && resolved.sortDirection === "asc"
              ? "desc"
              : "asc",
          page: undefined,
        }),
    }),
    pageSize: {
      value: resolved.pageSize,
      options: standardPageSizeOptions,
      onValueChange: (pageSize: number) =>
        change({
          pageSize: pageSize as typeof resolved.pageSize,
          page: undefined,
        }),
    },
    sort: {
      value: resolved.sortType,
      options: performanceSortTypes.map((value) => ({
        value,
        label: t(`fields.${value}`),
      })),
      onValueChange: (sortType: typeof resolved.sortType) =>
        change({ sortType, page: undefined }),
    },
    pagination: {
      page: data.page,
      totalPages: data.totalPages,
      onPageChange: (page: number) => change({ page }),
    },
  };
}
