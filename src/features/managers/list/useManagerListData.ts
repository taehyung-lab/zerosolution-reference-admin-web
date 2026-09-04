import { isFeatureError } from '@/api/error-outcome';
import { blockingProgress, contentProgress } from '@/api/query-meta';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import type { ListResultData } from '@/shared/ui/patterns/ListResult';
import { hashKey, keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { managerListQuery } from '../api/queries';
import type { ManagerListItem } from '../model/manager';
import { toManagerListItem } from '../model/manager-mapper';
import { resolveManagerSearch, type ManagerRouteSearch } from './search-schema';

export type ManagerListData = ListResultData<ManagerListItem> & {
  readonly total: number;
  readonly totalPages: number;
};

/** Owns only the manager-list Query, response mapping, totals, and fetch facts. */
export function useManagerListData(routeSearch: ManagerRouteSearch) {
  const { locale } = useLocale();
  const search = resolveManagerSearch(routeSearch);
  const searched = routeSearch.periodType !== undefined;
  const options = managerListQuery(locale, search);
  const [entryQueryHash] = useState(() =>
    searched ? hashKey(options.queryKey) : undefined,
  );
  const entryFetch = entryQueryHash === hashKey(options.queryKey);
  const query = useQuery({
    ...options,
    enabled: searched,
    placeholderData: keepPreviousData,
    ...(entryFetch ? blockingProgress : contentProgress),
  });
  const total = query.data?.totalCount ?? 0;
  const rows = (query.data?.list ?? []).map(toManagerListItem);
  const error = isFeatureError(query.error) ? query.error : undefined;

  return {
    rows,
    total,
    totalPages: toTotalPages(total, search.pageSize),
    searched,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError && error !== undefined,
    trace: error,
    retry: query.refetch,
  } satisfies ManagerListData;
}
