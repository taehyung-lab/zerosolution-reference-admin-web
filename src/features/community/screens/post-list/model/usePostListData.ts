import { useListQuery } from '@/api/list-query';
import { postListQueryOptions } from '@/features/community/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toPostListRequest, type PostListView } from './post-list-search';

/**
 * 게시물 목록의 조회 사실. 이 화면은 진입 즉시 조회이므로 `searched` 는 항상 참이다
 * (근거는 `post-list-search.ts` 의 진입 정책 주석과 POST-LIST 미확인 1).
 */
export function usePostListData(search: PostListView) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: postListQueryOptions(locale, toPostListRequest(search)),
    searched: true,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });

  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
