import { queryOptions } from '@tanstack/react-query';
import type { UiLocale } from '@/shared/i18n/locale';
import { readPrinterDetail, readPrinterListPage } from '../fixtures/printers';
import type { PrinterDetail, PrinterListPage, PrinterListRequest } from '../model/printer';
import { ticketingQueryKeys } from './keys';

/**
 * 스마트프린터 목록 조회의 유일한 query 선언. 화면과 테스트가 같은 정의를 소비한다.
 *
 * TRANSPLANT_PENDING_TICKETING_PRINTER_QUERY: queryFn 은 아직 임시 응답 함수다. 실제 endpoint 가
 * 확정되면 여기서 생성된 operation 을 호출하고 fixtures 를 지운다. 요청 입력과 캐시 키는 화면이
 * 해소한 같은 값이므로 그때도 바뀌지 않는다.
 */
export function printerListQueryOptions(locale: UiLocale, request: PrinterListRequest) {
  return queryOptions<PrinterListPage>({
    queryKey: ticketingQueryKeys.printerList(locale, request),
    queryFn: () => readPrinterListPage(request),
  });
}

/**
 * 스마트프린터 한 건의 조회 query. 조회 화면과 수정 화면, 두 route loader 가 같은 정의를 쓴다.
 * route loader 가 진입을 기다리므로 `meta.progress` 를 선언하지 않는다(대기 표면은 `RoutePending`).
 *
 * TRANSPLANT_PENDING_TICKETING_PRINTER_QUERY: queryFn 은 임시 응답 함수다. 키는 ID 기반이라
 * 실제 endpoint 가 확정돼도 바뀌지 않는다.
 */
export function printerDetailQueryOptions(locale: UiLocale, printerId: string) {
  return queryOptions<PrinterDetail>({
    queryKey: ticketingQueryKeys.printerDetail(locale, printerId),
    queryFn: () => readPrinterDetail(printerId),
  });
}
