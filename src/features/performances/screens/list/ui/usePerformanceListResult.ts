import { standardPageSizeOptions } from "@/shared/model/list-options";
import { useTranslation } from "react-i18next";
import {
  performanceSearchSchema,
  performanceSortTypes,
  type ResolvedPerformanceSearch,
  type PerformanceRouteSearch,
} from "../model/search-schema";
import type { usePerformanceListData } from "../model/usePerformanceListData";
import { performanceColumns } from "./performance-columns";

export function usePerformanceListResult(
  search: ResolvedPerformanceSearch,
  data: ReturnType<typeof usePerformanceListData>,
  onChange: (next: PerformanceRouteSearch) => void,
) {
  const { t } = useTranslation("performances");
  const change = (patch: PerformanceRouteSearch) =>
    onChange(
      performanceSearchSchema.parse({
        ...search,
        searched: data.searched ? undefined : false,
        ...patch,
      }),
    );

  return {
    columns: performanceColumns({
      t,
      search: search,
      total: data.total,
      onSort: (sortType) =>
        change({
          sortType,
          sortDirection:
            search.sortType === sortType && search.sortDirection === "asc"
              ? "desc"
              : "asc",
          page: undefined,
        }),
    }),
    pageSize: {
      value: search.pageSize,
      options: standardPageSizeOptions,
      onValueChange: (pageSize: number) =>
        change({
          pageSize: pageSize as typeof search.pageSize,
          page: undefined,
        }),
    },
    sort: {
      value: search.sortType,
      options: performanceSortTypes.map((value) => ({
        value,
        label: t(`fields.${value}`),
      })),
      onValueChange: (sortType: typeof search.sortType) =>
        change({ sortType, page: undefined }),
    },
    pagination: {
      page: data.page,
      totalPages: data.totalPages,
      onPageChange: (page: number) => change({ page }),
    },
  };
}
