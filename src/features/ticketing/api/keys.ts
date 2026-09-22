import { localizedQueryKey } from '@/api/query-key';
import type { PrinterListRequest } from '../model/printer';
import type { TicketIssueListRequest } from '../model/ticket-issue';

/** 캐시 주소만 소유하는 leaf 모듈. 화면·model·query 를 import 하지 않는다. */
export const ticketingQueryKeys = {
  /** 스마트프린터 계열 전체. 쓰기 성공 뒤 목록·상세를 함께 무효화하는 prefix 다. */
  printers: (locale: string) => localizedQueryKey(locale, 'ticketing', 'printers'),
  printerList: (locale: string, request: PrinterListRequest) =>
    [...localizedQueryKey(locale, 'ticketing', 'printers', 'list'), request] as const,
  printerDetail: (locale: string, printerId: string) =>
    [...localizedQueryKey(locale, 'ticketing', 'printers', 'detail'), printerId] as const,
  /** 발권 내역 계열 전체. 일괄변경 성공 뒤 목록을 무효화하는 prefix 다. */
  ticketIssues: (locale: string) => localizedQueryKey(locale, 'ticketing', 'issues'),
  ticketIssueList: (locale: string, request: TicketIssueListRequest) =>
    [...localizedQueryKey(locale, 'ticketing', 'issues', 'list'), request] as const,
  /** 공연 검색 lookup 의 선택지. 조건과 무관한 참조 목록이라 request 를 키에 넣지 않는다. */
  ticketIssuePerformances: (locale: string) =>
    localizedQueryKey(locale, 'ticketing', 'issues', 'performances'),
  ticketIssueSchedules: (locale: string, performanceId: string) =>
    [...localizedQueryKey(locale, 'ticketing', 'issues', 'schedules'), performanceId] as const,
};
