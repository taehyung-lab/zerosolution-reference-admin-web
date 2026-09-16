import { useListQuery } from '@/api/list-query';
import { printerListQueryOptions } from '@/features/ticketing/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toPrinterListRequest } from './printer-list-search';
import type { ResolvedPrinterListSearch } from './printer-list-search';

/**
 * 스마트프린터 목록의 조회 사실을 만든다. 이 화면은 진입 즉시 조회이므로 검색 표식이 없고
 * `searched` 는 항상 참이다(원문 절 제목 「스마트프린터 리스트를 조회할 수 있다」).
 */
export function usePrinterListData(search: ResolvedPrinterListSearch) {
  const { locale } = useLocale();
  const request = toPrinterListRequest(search);
  const query = useListQuery({
    options: printerListQueryOptions(locale, request),
    searched: true,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });

  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
