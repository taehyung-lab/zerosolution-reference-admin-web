import type {
  PerformancePage,
  PerformanceRow,
  PerformanceVenue,
} from "../model/performance";
import type { PerformanceSearch } from "../model/performance-search";

// TRANSPLANT_PENDING_PERFORMANCE_REFERENCE_INPUTS: replace fixture IDs/options and the data source with the confirmed product contract.
export const performanceVenues: readonly PerformanceVenue[] = [
  { id: "reference-venue-a", name: "Reference Hall A" },
  { id: "reference-venue-b", name: "Reference Hall B" },
];
const rows: readonly PerformanceRow[] = performanceVenues.map(
  (venue, index) => ({
    id: `reference-performance-${index + 1}`,
    ticketKind: "day",
    performanceType: "concert",
    title: `Reference Performance ${index + 1}`,
    sessionCount: 2,
    performers: "Reference Performer",
    organizer: "Reference Organizer",
    period: "2026-09-01",
    venueId: venue.id,
    venueName: venue.name,
    seller: "zero",
    registeredAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-02T00:00:00Z",
  }),
);
/** 공연장 선택지의 임시 응답이다. 실제 조회가 연결되면 이 함수만 교체한다. */
export function readPerformanceVenues(): Promise<readonly PerformanceVenue[]> {
  return Promise.resolve(performanceVenues);
}
export function readPerformancePage(
  search: PerformanceSearch,
): Promise<PerformancePage> {
  const filtered = rows
    .filter(
      (row) =>
        (!search.venueId || row.venueId === search.venueId) &&
        (!search.ticketKinds?.length ||
          search.ticketKinds.includes(row.ticketKind)) &&
        (!search.performanceTypes?.length ||
          search.performanceTypes.includes(row.performanceType)) &&
        (!search.sellers?.length || search.sellers.includes(row.seller)) &&
        (!search.keywords?.length ||
          search.keywords.every(({ field, value }) =>
            row[field].toLocaleLowerCase().includes(value.toLocaleLowerCase()),
          )),
    )
    .filter((row) => {
      if (!search.periodType) return true;
      const instant =
        search.periodType === "performedAt"
          ? `${row.period}T00:00:00Z`
          : row[search.periodType];
      return (
        (!search.startDateTime ||
          Date.parse(instant) >= Date.parse(search.startDateTime)) &&
        (!search.endDateTime ||
          Date.parse(instant) <= Date.parse(search.endDateTime))
      );
    });
  filtered.sort(
    (a, b) =>
      a[search.sortType].localeCompare(b[search.sortType]) *
      (search.sortDirection === "asc" ? 1 : -1),
  );
  return Promise.resolve({
    rows: filtered.slice(
      (search.page - 1) * search.pageSize,
      search.page * search.pageSize,
    ),
    total: filtered.length,
  });
}
