import { useListQuery } from '@/api/list-query';
import { boardListQueryOptions } from '@/features/community/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toBoardListRequest } from './board-list-search';
import type { ResolvedBoardListSearch } from './board-list-search';

/**
 * 게시판 목록의 조회 사실을 만든다. 이 화면은 진입 즉시 조회이므로 검색 표식이 없고
 * `searched` 는 항상 참이다(원장 7행, 2026-09-10 사용자 확정).
 */
export function useBoardListData(search: ResolvedBoardListSearch) {
  const { locale } = useLocale();
  const request = toBoardListRequest(search);
  const query = useListQuery({
    options: boardListQueryOptions(locale, request),
    searched: true,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });

  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
