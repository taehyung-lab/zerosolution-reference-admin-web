import { ApiError } from '@/api/error';
import type {
  PrinterChangeLog,
  PrinterDetail,
  PrinterListPage,
  PrinterListRequest,
  PrinterRow,
  PrinterSortKey,
} from '../model/printer';

/**
 * TRANSPLANT_PENDING_TICKETING_PRINTER_QUERY: 이 저장소에는 스마트프린터 조회 API 가 없다(AGENTS 1절).
 * 아래 행과 필터·정렬·페이지 계산은 서버 페이지 응답을 흉내 내는 예시이며 endpoint·DTO·enum 을
 * 확정 계약으로 표현하지 않는다. 실제 계약이 확정되면 `api/queries.ts` 의 queryFn 과 함께 교체하고
 * feature 에는 검색 입력 매핑과 응답 projection 만 남긴다.
 */
const printers: readonly PrinterRow[] = [
  {
    id: 'reference-printer-1',
    name: '001-12345648',
    serialNo: 'ZERO123456-45678',
    model: 'ZERO123456',
    manufacturer: 'Reference Devices',
    purchasedAt: '2026-01-02',
    location: '사무실 A-1',
    status: 'NORMAL',
    measures: '',
    purpose: 'EXTERNAL',
    usage: 'IN_USE',
    registeredAt: '2026-06-01T03:00:00.000Z',
    updatedAt: '2026-06-01T03:00:00.000Z',
  },
  {
    id: 'reference-printer-2',
    name: '001-12345649',
    serialNo: 'ZERO123456-45679',
    model: 'ZERO123456',
    manufacturer: 'Reference Devices',
    purchasedAt: '2026-01-02',
    location: '사무실 A-2',
    status: 'BROKEN',
    measures: '리본 교체 요청',
    purpose: 'INTERNAL',
    usage: 'NOT_IN_USE',
    registeredAt: '2026-06-02T01:20:00.000Z',
    updatedAt: '2026-08-11T05:40:00.000Z',
  },
  {
    id: 'reference-printer-3',
    name: '002-20001101',
    serialNo: 'ZERO200011-01001',
    model: 'ZERO200011',
    manufacturer: 'Orbit Print',
    purchasedAt: '2026-02-17',
    location: '공연장 부스 1',
    status: 'REPAIR',
    measures: '헤드 수리 접수',
    purpose: 'EXTERNAL',
    usage: 'IN_USE',
    registeredAt: '2026-06-09T22:05:00.000Z',
    updatedAt: '2026-09-01T02:10:00.000Z',
  },
  {
    id: 'reference-printer-4',
    name: '002-20001102',
    serialNo: 'ZERO200011-01002',
    model: 'ZERO200011',
    manufacturer: 'Orbit Print',
    purchasedAt: '2026-03-05',
    location: '공연장 부스 2',
    status: 'NORMAL',
    measures: '',
    purpose: 'EXTERNAL',
    usage: 'IN_USE',
    registeredAt: '2026-07-14T06:45:00.000Z',
    updatedAt: '2026-07-14T06:45:00.000Z',
  },
  {
    id: 'reference-printer-5',
    name: '003-31500210',
    serialNo: 'ZERO315002-10021',
    model: 'ZERO315002',
    manufacturer: 'Reference Devices',
    purchasedAt: '',
    location: '창고 B',
    status: 'NORMAL',
    measures: '',
    purpose: 'INTERNAL',
    usage: 'NOT_IN_USE',
    registeredAt: '2026-08-03T11:30:00.000Z',
    updatedAt: '2026-09-10T00:05:00.000Z',
  },
];

function sortValue(row: PrinterRow, key: PrinterSortKey): string {
  switch (key) {
    case 'registeredAt':
      return row.registeredAt;
    case 'updatedAt':
      return row.updatedAt;
    case 'name':
      return row.name;
    case 'serialNo':
      return row.serialNo;
    case 'model':
      return row.model;
    case 'manufacturer':
      return row.manufacturer;
    case 'location':
      return row.location;
    case 'status':
      return row.status;
    case 'measures':
      return row.measures;
    case 'purchasedAt':
      return row.purchasedAt;
    case 'purpose':
      return row.purpose;
    case 'usage':
      return row.usage;
  }
}

function matches(row: PrinterRow, request: PrinterListRequest): boolean {
  const instant = request.periodType === 'registeredAt' ? row.registeredAt : row.updatedAt;
  if (request.startDateTime !== undefined && instant < request.startDateTime) return false;
  if (request.endDateTime !== undefined && instant > request.endDateTime) return false;
  if (
    request.keywords?.length &&
    !request.keywords.some(({ field, value }) => row[field].includes(value))
  )
    return false;
  if (request.statuses?.length && !request.statuses.includes(row.status)) return false;
  if (request.purposes?.length && !request.purposes.includes(row.purpose)) return false;
  if (request.usages?.length && !request.usages.includes(row.usage)) return false;
  return true;
}

/**
 * 업데이트 이력 예시 — Figma 조회 frame: `등록` 한 줄과 `수정` + `항목 : 이전 > 이후` 줄들
 * (`모델명 : ZERO > ZERO123456`, `제조사 : - > 국내`, `구매일 : 2025-06-01 > 2026-06-01`).
 */
const changeLogs: Readonly<Record<string, readonly PrinterChangeLog[]>> = {
  'reference-printer-1': [
    {
      id: 'reference-printer-1-log-2',
      updatedAt: '2026-06-01T04:54:41.000Z',
      kind: 'UPDATE',
      changes: [
        { field: 'model', before: 'ZERO', after: 'ZERO123456' },
        { field: 'manufacturer', before: '', after: 'Reference Devices' },
        { field: 'purchasedAt', before: '2025-06-01', after: '2026-01-02' },
      ],
      manager: 'Reference Manager',
    },
    {
      id: 'reference-printer-1-log-1',
      updatedAt: '2026-06-01T03:12:11.000Z',
      kind: 'CREATE',
      changes: [],
      manager: 'Reference Manager',
    },
  ],
  'reference-printer-2': [
    {
      id: 'reference-printer-2-log-2',
      updatedAt: '2026-08-11T05:40:00.000Z',
      kind: 'UPDATE',
      changes: [
        { field: 'status', before: 'NORMAL', after: 'BROKEN' },
        { field: 'usage', before: 'IN_USE', after: 'NOT_IN_USE' },
      ],
      manager: 'Reference Manager',
    },
    {
      id: 'reference-printer-2-log-1',
      updatedAt: '2026-06-02T01:20:00.000Z',
      kind: 'CREATE',
      changes: [],
      manager: 'Reference Manager',
    },
  ],
};

export function readPrinterDetail(printerId: string): Promise<PrinterDetail> {
  const row = printers.find((printer) => printer.id === printerId);
  if (row === undefined) {
    return Promise.reject(
      new ApiError({ kind: 'not-found', message: `printer ${printerId} not found` }),
    );
  }
  return Promise.resolve({ ...row, changeLogs: changeLogs[row.id] ?? [] });
}

export function readPrinterListPage(request: PrinterListRequest): Promise<PrinterListPage> {
  const filtered = printers.filter((row) => matches(row, request));
  const descending = request.sortDirection === 'desc';
  const sorted = [...filtered].sort((left, right) => {
    const a = sortValue(left, request.sortType);
    const b = sortValue(right, request.sortType);
    const order = a === b ? 0 : a < b ? -1 : 1;
    return descending ? -order : order;
  });
  const start = (request.page - 1) * request.pageSize;
  return Promise.resolve({
    rows: sorted.slice(start, start + request.pageSize),
    total: sorted.length,
  });
}
