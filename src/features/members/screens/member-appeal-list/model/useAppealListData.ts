import { useListQuery } from '@/api/list-query';
import { appealListQueryOptions } from '@/features/members/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toAppealListRequest, type AppealListView } from './appeal-list-search';

/** 소명신청 목록의 조회 사실. 진입 즉시 조회한다. */
export function useAppealListData(search: AppealListView) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: appealListQueryOptions(locale, toAppealListRequest(search)),
    searched: true,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });
  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
