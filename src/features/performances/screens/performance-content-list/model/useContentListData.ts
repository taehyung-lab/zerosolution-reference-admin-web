import { useListQuery } from '@/api/list-query';
import { contentListQueryOptions } from '@/features/performances/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toContentListRequest, type ContentListView } from './content-list-search';

/** 콘텐츠 목록의 조회 사실. 이 화면은 진입 즉시 조회이므로 `searched` 는 항상 참이다. */
export function useContentListData(search: ContentListView) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: contentListQueryOptions(locale, toContentListRequest(search)),
    searched: true,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });

  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
