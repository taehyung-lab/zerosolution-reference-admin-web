import { useListQuery } from '@/api/list-query';
import { dormantListQueryOptions } from '@/features/members/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toDormantListRequest, type DormantListView } from './dormant-list-search';

/** 휴면회원 목록의 조회 사실. 검색 전에는 조회하지 않고 안내 문구 상태다. */
export function useDormantListData(search: DormantListView) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: dormantListQueryOptions(locale, toDormantListRequest(search)),
    searched: search.searched,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });
  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
