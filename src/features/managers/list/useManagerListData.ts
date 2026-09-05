import { useListQuery } from '@/api/list-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import type { ListResultData } from '@/shared/ui/patterns/ListResult';
import { managerListQuery } from '../api/queries';
import type { ManagerListItem } from '../model/manager';
import { toManagerListItem } from '../model/manager-mapper';
import { resolveManagerSearch, type ManagerRouteSearch } from './search-schema';

export type ManagerListData = ListResultData<ManagerListItem> & {
  readonly total: number;
  readonly totalPages: number;
};

/** Owns only the manager contract: which query runs, what counts as searched, and row mapping. */
export function useManagerListData(routeSearch: ManagerRouteSearch): ManagerListData {
  const { locale } = useLocale();
  const search = resolveManagerSearch(routeSearch);
  const list = useListQuery({
    options: managerListQuery(locale, search),
    searched: routeSearch.periodType !== undefined,
    select: (data) => ({
      rows: (data.list ?? []).map(toManagerListItem),
      total: data.totalCount ?? 0,
    }),
  });

  return { ...list, totalPages: toTotalPages(list.total, search.pageSize) };
}
