import { mutationOptions } from '@tanstack/react-query';
import { notConnected } from '@/api/not-connected';
import type { UiLocale } from '@/shared/i18n/locale';
import type { PrinterBulkChange, PrinterSettings } from '../model/printer';
import { ticketingQueryKeys } from './keys';

/**
 * 스마트프린터의 쓰기 다섯 개. 원문이 적은 도달 조건(등록·수정은 검증 → 저장 확인, 삭제는 삭제 확인,
 * 일괄변경은 선택 + 값 + 변경 확인, 선택복사는 선택)까지가 화면의 책임이고 그 다음이 여기다.
 *
 * TRANSPLANT_PENDING_TICKETING_PRINTER_MUTATION: 이 저장소에는 서버 계약이 없어 모두 미연결 오류로
 * 끝난다. 화면은 그 실패를 공용 문구로 보여 주고 성공 이후(완료 alert·이동·캐시 갱신)는 만들지 않는다.
 * endpoint 가 확정되면 `mutationFn` 만 바꾼다. 성공 시 무효화할 캐시는 `meta.invalidates` 가 이미 선언한다.
 */
export interface PrinterBulkChangeRequest {
  readonly targetIds: readonly string[];
  readonly change: PrinterBulkChange;
}

export interface PrinterCopyRequest {
  readonly targetIds: readonly string[];
}

function invalidates(locale: UiLocale) {
  return { meta: { invalidates: [ticketingQueryKeys.printers(locale)] } };
}

export function createPrinterMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: notConnected<PrinterSettings>('ticketing.printer.create'),
    ...invalidates(locale),
  });
}

export function updatePrinterMutation(locale: UiLocale, printerId: string) {
  return mutationOptions({
    mutationFn: notConnected<PrinterSettings>(`ticketing.printer.update:${printerId}`),
    ...invalidates(locale),
  });
}

export function deletePrinterMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: notConnected<string>('ticketing.printer.delete'),
    ...invalidates(locale),
  });
}

export function bulkChangePrintersMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: notConnected<PrinterBulkChangeRequest>('ticketing.printer.bulkChange'),
    ...invalidates(locale),
  });
}

export function copyPrintersMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: notConnected<PrinterCopyRequest>('ticketing.printer.copy'),
    ...invalidates(locale),
  });
}
