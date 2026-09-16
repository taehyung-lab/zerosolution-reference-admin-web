import { useListQuery } from '@/api/list-query';
import { accessListQueryOptions } from '@/features/members/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toAccessListRequest, type AccessListView } from './access-list-search';

/** 회원접속 목록의 조회 사실. 검색 전에는 조회하지 않는다. */
export function useAccessListData(search: AccessListView) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: accessListQueryOptions(locale, toAccessListRequest(search)),
    searched: search.searched,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });
  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
