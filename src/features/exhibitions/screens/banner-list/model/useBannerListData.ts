import { useListQuery } from '@/api/list-query';
import { bannerListQueryOptions } from '@/features/exhibitions/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toBannerListRequest, type BannerListView } from './banner-list-search';

/**
 * 배너 목록의 조회 사실. 이 화면은 진입 즉시 조회이므로 `searched` 는 항상 참이다
 * (근거는 `banner-list-search.ts` 의 진입 정책 주석).
 */
export function useBannerListData(search: BannerListView) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: bannerListQueryOptions(locale, toBannerListRequest(search)),
    searched: true,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });

  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
