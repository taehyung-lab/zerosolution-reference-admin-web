import { useListQuery } from "@/api/list-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { toTotalPages } from "@/shared/lib/search";
import { performanceListQuery } from "../../../api/queries";
import { type ResolvedPerformanceSearch } from "./search-schema";

export function usePerformanceListData(
  search: ResolvedPerformanceSearch) {
  const { locale } = useLocale();
  const list = useListQuery({
    options: performanceListQuery(locale, search),
    searched: true,
    select: (page) => page,
  });

  return {
    ...list,
    page: search.page,
    pageSize: search.pageSize,
    totalPages: toTotalPages(list.total, search.pageSize),
  };
}
