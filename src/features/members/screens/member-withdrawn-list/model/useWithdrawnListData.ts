import { useListQuery } from '@/api/list-query';
import { withdrawnListQueryOptions } from '@/features/members/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toWithdrawnListRequest, type WithdrawnListView } from './withdrawn-list-search';

/** 탈퇴회원 목록의 조회 사실. 검색 전에는 조회하지 않는다. */
export function useWithdrawnListData(search: WithdrawnListView) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: withdrawnListQueryOptions(locale, toWithdrawnListRequest(search)),
    searched: search.searched,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });
  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
