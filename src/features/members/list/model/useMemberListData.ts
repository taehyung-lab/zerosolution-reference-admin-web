/** 검색 게이트와 행 변환은 feature가 소유하고 로딩·오류·재시도는 공용 Query에 맡긴다. */
import { useListQuery } from '@/api/list-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import type { ListResultData } from '@/shared/ui/patterns/ListResult';
import { memberListQuery } from '../../api/list-queries';
import { memberListSearched, toMemberListRow } from './member-list-page';
import type { MemberListRow } from './member-row';
import { resolveMemberSearch, type MemberRouteSearch } from './search-schema';
export type MemberListData = ListResultData<MemberListRow> & {
  readonly total: number;
  readonly totalPages: number;
};
export function useMemberListData(
  routeSearch: MemberRouteSearch,
  variant: 'all' | 'general' | 'flagged'
): MemberListData {
  const { locale } = useLocale();
  const search = resolveMemberSearch(routeSearch);
  const data = useListQuery({
    options: memberListQuery(locale, search, variant),
    searched: memberListSearched(routeSearch),
    select: (page) => ({
      rows: page.rows.map(toMemberListRow),
      total: page.total,
    }),
  });

  return { ...data, totalPages: toTotalPages(data.total, search.pageSize) };
}
