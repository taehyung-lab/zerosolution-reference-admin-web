import { useListQuery } from "@/api/list-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { toTotalPages } from "@/shared/lib/search";
import { performanceListQuery } from "../../../api/queries";
import {
  resolvePerformanceSearch,
  type PerformanceRouteSearch,
} from "./search-schema";

export function usePerformanceListData(routeSearch: PerformanceRouteSearch) {
  const { locale } = useLocale();
  const search = resolvePerformanceSearch(routeSearch);
  const list = useListQuery({
    options: performanceListQuery(locale, search),
    searched: search.searched !== false,
    select: (page) => page,
  });

  return {
    ...list,
    page: search.page,
    pageSize: search.pageSize,
    totalPages: toTotalPages(list.total, search.pageSize),
  };
}
