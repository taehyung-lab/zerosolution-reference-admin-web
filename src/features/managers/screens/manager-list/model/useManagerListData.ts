import { useListQuery } from '@/api/list-query';
import { managerListQueryOptions } from '@/features/managers/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toManagerListRequest, type ManagerListView } from './manager-list-search';

/** 운영자 목록의 조회 사실. 검색 전(`searched` 없음)에는 조회하지 않고 안내 문구 상태다. */
export function useManagerListData(search: ManagerListView) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: managerListQueryOptions(locale, toManagerListRequest(search)),
    searched: search.searched,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });

  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
