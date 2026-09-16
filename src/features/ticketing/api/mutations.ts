import { mutationOptions } from '@tanstack/react-query';
import { scenarioRequest } from '@/api/scenario';
import type { UiLocale } from '@/shared/i18n/locale';
import type { PrinterBulkChange, PrinterSettings } from '../model/printer';
import { ticketingQueryKeys } from './keys';

/**
 * 스마트프린터의 쓰기 다섯 개. 원문이 적은 도달 조건(등록·수정은 검증 → 저장 확인, 삭제는 삭제 확인,
 * 일괄변경은 선택 + 값 + 변경 확인, 선택복사는 선택)까지가 화면의 책임이고 그 다음이 여기다.
 *
 * TRANSPLANT_PENDING_TICKETING_PRINTER_MUTATION: 이 저장소에는 서버 계약이 없어 `mutationFn` 은 도달만
 * 기록하고 성공으로 끝난다. endpoint 가 확정되면 그 함수 본문만 바꾼다. 성공 시 무효화할 캐시는
 * `meta.invalidates` 가 이미 선언한다.
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
    mutationFn: scenarioRequest<PrinterSettings>('스마트프린터 등록'),
    ...invalidates(locale),
  });
}

export function updatePrinterMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly printerId: string; readonly settings: PrinterSettings }>('스마트프린터 수정'),
    ...invalidates(locale),
  });
}

export function deletePrinterMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<string>('스마트프린터 삭제'),
    ...invalidates(locale),
  });
}

export function bulkChangePrintersMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<PrinterBulkChangeRequest>('스마트프린터 일괄변경'),
    ...invalidates(locale),
  });
}

export function copyPrintersMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<PrinterCopyRequest>('스마트프린터 선택복사'),
    ...invalidates(locale),
  });
}
