import { mutationOptions } from '@tanstack/react-query';
import { scenarioRequest } from '@/api/scenario';
import type { UiLocale } from '@/shared/i18n/locale';
import type { PrinterBulkChange, PrinterSettings } from '../model/printer';
import type {
  TicketIssueBulkChange,
  TicketIssueDownloadScope,
  TicketIssueListRequest,
} from '../model/ticket-issue';
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

/**
 * 6.2 전체발권 결과 toolbar 의 쓰기 둘. 원문이 적은 도달 조건(일괄변경은 선택 + 값 + 변경 확인,
 * 다운로드는 범위 + 그 범위가 요구하는 선택)까지가 화면의 책임이고 그 다음이 여기다.
 *
 * TRANSPLANT_PENDING_TICKETING_ISSUE_MUTATION: 서버 계약이 없어 `mutationFn` 은 도달만 기록하고
 * 성공으로 끝난다. endpoint 가 확정되면 그 함수 본문만 바꾼다. 다운로드의 파일 형식·열 구성은
 * `product/facts/TICKET-ISSUE-LIST.md` 미확인 8 이라 응답을 파일로 다루지 않는다.
 */
export interface TicketIssueBulkChangeRequest {
  readonly targetIds: readonly string[];
  readonly change: TicketIssueBulkChange;
}

export interface TicketIssueDownloadRequest {
  readonly scope: TicketIssueDownloadScope;
  /** `SELECTED` 일 때만 채워진다. `ALL` 은 검색 조건 전체가 대상이다. */
  readonly targetIds: readonly string[];
  readonly search: TicketIssueListRequest;
}

function invalidatesTicketIssues(locale: UiLocale) {
  return { meta: { invalidates: [ticketingQueryKeys.ticketIssues(locale)] } };
}

export function bulkChangeTicketIssuesMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<TicketIssueBulkChangeRequest>('전체발권 일괄변경'),
    ...invalidatesTicketIssues(locale),
  });
}

/** 다운로드는 조회를 바꾸지 않으므로 무효화할 cache 가 없다. */
export function downloadTicketIssuesMutation() {
  return mutationOptions({
    mutationFn: scenarioRequest<TicketIssueDownloadRequest>('전체발권 다운로드'),
  });
}
