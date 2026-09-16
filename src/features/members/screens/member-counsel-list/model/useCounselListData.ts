import { useListQuery } from '@/api/list-query';
import { counselListQueryOptions } from '@/features/members/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toCounselListRequest, type CounselListView } from './counsel-list-search';

/** 회원상담 목록의 조회 사실. 진입 즉시 조회한다. */
export function useCounselListData(search: CounselListView) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: counselListQueryOptions(locale, toCounselListRequest(search)),
    searched: true,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });
  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
