import { localizedQueryKey } from '@/api/query-key';
import type { PrinterListRequest } from '../model/printer';

/** 캐시 주소만 소유하는 leaf 모듈. 화면·model·query 를 import 하지 않는다. */
export const ticketingQueryKeys = {
  /** 스마트프린터 계열 전체. 쓰기 성공 뒤 목록·상세를 함께 무효화하는 prefix 다. */
  printers: (locale: string) => localizedQueryKey(locale, 'ticketing', 'printers'),
  printerList: (locale: string, request: PrinterListRequest) =>
    [...localizedQueryKey(locale, 'ticketing', 'printers', 'list'), request] as const,
  printerDetail: (locale: string, printerId: string) =>
    [...localizedQueryKey(locale, 'ticketing', 'printers', 'detail'), printerId] as const,
};
