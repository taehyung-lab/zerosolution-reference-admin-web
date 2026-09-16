import { useListQuery } from '@/api/list-query';
import { printerListQueryOptions } from '@/features/ticketing/api/queries';
import { useLocale } from '@/shared/i18n/locale-context';
import { toTotalPages } from '@/shared/lib/search';
import { toPrinterListRequest, type PrinterListView } from './printer-list-search';

/**
 * 스마트프린터 목록의 조회 사실. 이 화면은 진입 즉시 조회이므로 `searched` 는 항상 참이다
 * (원문 절 제목 「스마트프린터 리스트를 조회할 수 있다」).
 */
export function usePrinterListData(search: PrinterListView) {
  const { locale } = useLocale();
  const query = useListQuery({
    options: printerListQueryOptions(locale, toPrinterListRequest(search)),
    searched: true,
    select: (page) => ({ rows: page.rows, total: page.total }),
  });

  return { ...query, totalPages: toTotalPages(query.total, search.pageSize) };
}
