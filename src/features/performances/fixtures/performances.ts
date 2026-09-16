import type {
  PerformanceListPage,
  PerformanceListRequest,
  PerformanceRow,
  PerformanceVenue,
} from '../model/performance';

/**
 * TRANSPLANT_PENDING_PERFORMANCE_QUERY: 이 저장소에는 공연 조회 API 가 없다. 아래 행과 필터·정렬·페이지
 * 계산은 서버 페이지 응답을 흉내 내는 예시이며 endpoint·DTO·enum 을 확정 계약으로 표현하지 않는다.
 * 실제 계약이 확정되면 `api/queries.ts` 의 queryFn 과 함께 교체한다.
 */
export const performanceVenues: readonly PerformanceVenue[] = [
  { id: 'reference-venue-a', name: 'Reference Hall A' },
  { id: 'reference-venue-b', name: 'Reference Hall B' },
];

const rows: readonly PerformanceRow[] = performanceVenues.map((venue, index) => ({
  id: `reference-performance-${index + 1}`,
  ticketKind: 'day',
  performanceType: 'concert',
  title: `Reference Performance ${index + 1}`,
  sessionCount: 2,
  performers: 'Reference Performer',
  organizer: 'Reference Organizer',
  period: '2026-09-01',
  venueId: venue.id,
  venueName: venue.name,
  seller: 'zero',
  registeredAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-02T00:00:00Z',
}));

/** 공연장 선택지의 임시 응답. 실제 조회가 연결되면 이 함수만 교체한다. */
export function readPerformanceVenues(): Promise<readonly PerformanceVenue[]> {
  return Promise.resolve(performanceVenues);
}

function matches(row: PerformanceRow, request: PerformanceListRequest): boolean {
  if (request.venueId !== undefined && row.venueId !== request.venueId) return false;
  if (request.ticketKinds?.length && !request.ticketKinds.includes(row.ticketKind)) return false;
  if (request.performanceTypes?.length && !request.performanceTypes.includes(row.performanceType)) return false;
  if (request.sellers?.length && !request.sellers.includes(row.seller)) return false;
  if (
    request.keywords?.length &&
    !request.keywords.every(({ field, value }) => row[field].toLowerCase().includes(value.toLowerCase()))
  )
    return false;
  const instant = request.periodType === 'performedAt' ? `${row.period}T00:00:00Z` : row[request.periodType];
  if (request.startDateTime !== undefined && Date.parse(instant) < Date.parse(request.startDateTime)) return false;
  if (request.endDateTime !== undefined && Date.parse(instant) > Date.parse(request.endDateTime)) return false;
  return true;
}

export function readPerformancePage(request: PerformanceListRequest): Promise<PerformanceListPage> {
  const filtered = rows.filter((row) => matches(row, request));
  const descending = request.sortDirection === 'desc';
  filtered.sort((left, right) => {
    const order = left[request.sortType].localeCompare(right[request.sortType]);
    return descending ? -order : order;
  });
  const start = (request.page - 1) * request.pageSize;
  return Promise.resolve({ rows: filtered.slice(start, start + request.pageSize), total: filtered.length });
}
