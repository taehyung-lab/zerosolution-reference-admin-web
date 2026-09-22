import { useListQuery } from '@/api/list-query';
import { termsListQueryOptions } from '@/features/terms/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toTermsListRequest, type TermsListView } from './terms-list-search';

/**
 * 약관 목록의 조회 사실. 이 화면은 진입 즉시 조회이므로 `searched` 는 항상 참이다
 * (근거는 `terms-list-search.ts` 의 진입 정책 주석과 TERMS-LIST 미확인 3).
 */
export function useTermsListData(search: TermsListView) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: termsListQueryOptions(locale, toTermsListRequest(search)),
    searched: true,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });

  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
